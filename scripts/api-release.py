#!/usr/bin/env python3
"""Geschützter Einzelhost-Guard. Ausschließlich technische Metadaten in 0700/0600-Dateien."""
import argparse
import base64
import contextlib
import ctypes
import fcntl
import hashlib
import http.client
import ipaddress
import json
import os
import re
from pathlib import Path
import signal
import socket
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.parse
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = "('access','expense_budget','expenses','budget','savings_goals','api_version')"
SNAPSHOT = f"""
SELECT json_build_object('schema', json_build_object(
 'migrations', (SELECT json_agg(x ORDER BY version) FROM
   (SELECT version, description, checksum, success FROM access.flyway_schema_history) x),
 'schemas', (SELECT json_agg(x ORDER BY nspname) FROM
   (SELECT nspname,nspowner::regrole::text,nspacl::text FROM pg_namespace WHERE nspname IN {SCHEMAS}) x),
 'tables', (SELECT json_agg(x ORDER BY schema,name) FROM
   (SELECT n.nspname schema,c.relname name,c.relkind,c.relowner::regrole::text,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity,c.reloptions
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN {SCHEMAS}) x),
 'columns', (SELECT json_agg(x ORDER BY schema,name,attnum) FROM
   (SELECT n.nspname schema,c.relname name,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attacl::text,
     pg_get_expr(d.adbin,d.adrelid) default_value,cn.nspname collation_schema,co.collname,co.collowner::regrole::text collation_owner,co.collprovider,co.collisdeterministic,co.collencoding,co.collcollate,co.collctype,co.colllocale,co.collicurules,co.collversion,pg_collation_actual_version(co.oid) collation_actual_version
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    LEFT JOIN pg_collation co ON co.oid=a.attcollation LEFT JOIN pg_namespace cn ON cn.oid=co.collnamespace
    WHERE n.nspname IN {SCHEMAS} AND a.attnum>0 AND NOT a.attisdropped) x),
 'constraints', (SELECT json_agg(x ORDER BY schema,relation,name) FROM
   (SELECT n.nspname schema,r.relname relation,c.conname name,pg_get_constraintdef(c.oid) definition
    FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace LEFT JOIN pg_class r ON r.oid=c.conrelid WHERE n.nspname IN {SCHEMAS}) x),
 'indexes', (SELECT json_agg(x ORDER BY schemaname,indexname) FROM
   (SELECT schemaname,indexname,indexdef FROM pg_indexes WHERE schemaname IN {SCHEMAS}) x),
 'views', (SELECT json_agg(x ORDER BY schema,name) FROM
   (SELECT n.nspname schema,c.relname name,pg_get_viewdef(c.oid,true) definition
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN {SCHEMAS} AND c.relkind IN ('v','m')) x),
 'defaults', (SELECT json_agg(x ORDER BY role,schema,defaclobjtype) FROM
   (SELECT d.defaclrole::regrole::text role,n.nspname schema,d.defaclobjtype,d.defaclacl::text
    FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
    WHERE n.nspname IN {SCHEMAS} OR d.defaclnamespace=0) x),
 'policies', (SELECT json_agg(x ORDER BY schemaname,tablename,policyname) FROM
   (SELECT * FROM pg_policies WHERE schemaname IN {SCHEMAS}) x),
 'functions', (SELECT json_agg(x ORDER BY schema,name,args) FROM
   (SELECT n.nspname schema,p.proname name,pg_get_function_identity_arguments(p.oid) args,
    pg_get_functiondef(p.oid) definition,p.proacl::text,p.proowner::regrole::text
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN {SCHEMAS}) x),
 'rules', (SELECT json_agg(x ORDER BY schema,relation,name) FROM
   (SELECT n.nspname schema,c.relname relation,r.rulename name,r.ev_enabled,pg_get_ruledef(r.oid,true) definition
    FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN {SCHEMAS}) x),
 'triggers', (SELECT json_agg(x ORDER BY schema,relation,name) FROM
   (SELECT n.nspname schema,c.relname relation,t.tgname name,t.tgenabled,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN {SCHEMAS} AND NOT t.tgisinternal) x)),
 'roles',json_build_object(
 'database',(SELECT json_build_object('name',datname,'owner',datdba::regrole::text,'acl',datacl::text) FROM pg_database WHERE datname=current_database()),
 'roles',(SELECT json_agg(x ORDER BY rolname) FROM
   (SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolvaliduntil,rolconfig
    FROM pg_roles) x),
 'settings',(SELECT json_agg(x ORDER BY setdatabase,setrole) FROM (SELECT setdatabase,setrole,setconfig FROM pg_db_role_setting) x),
 'members',(SELECT json_agg(x ORDER BY role,member,grantor) FROM
   (SELECT r.rolname role,m.rolname member,g.rolname grantor,a.admin_option,a.inherit_option,a.set_option
    FROM pg_auth_members a JOIN pg_roles r ON r.oid=a.roleid JOIN pg_roles m ON m.oid=a.member JOIN pg_roles g ON g.oid=a.grantor
    ) x)))::text
"""

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def release_hash(path):
    return hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()

def boot_id():
    return Path('/proc/sys/kernel/random/boot_id').read_text().strip()

def process_identity(pid):
    try:
        raw = Path(f'/proc/{pid}/stat').read_text()
        fields = raw[raw.rindex(')') + 2:].split()
        if fields[0] == 'Z':
            return None
        return {'pid': pid, 'start': fields[19], 'group': int(fields[2]), 'session': int(fields[3]),
                'boot': boot_id()}
    except (FileNotFoundError, ProcessLookupError):
        return None

def signal_process(identity, action):
    try:
        descriptor = os.pidfd_open(identity['pid'])
    except ProcessLookupError: return
    try:
        current = process_identity(identity['pid'])
        if current is None: return
        if current != identity: raise RuntimeError('Prozessidentität vor Signal verändert.')
        signal.pidfd_send_signal(descriptor, action)
    except ProcessLookupError: pass
    finally: os.close(descriptor)

def descendants(pid):
    """Subreaper hält auch verwaiste setsid-/Doppel-Fork-Kinder in diesem Baum."""
    children = {}
    for item in Path('/proc').iterdir():
        if not item.name.isdecimal(): continue
        try:
            raw = (item / 'stat').read_text()
            fields = raw[raw.rindex(')') + 2:].split()
            children.setdefault(int(fields[1]), []).append(int(item.name))
        except (FileNotFoundError, ProcessLookupError): pass
    result, pending = [], [pid]
    while pending:
        for child in children.get(pending.pop(), []):
            pending.append(child)
            identity = process_identity(child)
            if identity: result.append(identity)
    return result

def end_containment(identity, timeout):
    current = process_identity(identity['pid'])
    if current is None: return
    if current != identity: raise RuntimeError('Supervisoridentität stimmt nicht; Wechsel gesperrt.')
    # Der lebende Subreaper wird zuletzt beendet. So kann keine verwaiste
    # Nachkommenschaft aus dem Baum entkommen, auch bei setsid()/Doppel-Fork.
    signal_process(identity, signal.SIGSTOP)
    deadline = time.monotonic() + timeout
    while True:
        try:
            raw = Path(f"/proc/{identity['pid']}/stat").read_text()
            if raw[raw.rindex(')') + 2:].split()[0] in ('T', 't'): break
        except FileNotFoundError:
            raise RuntimeError('Supervisor vor Einfriernachweis verschwunden.')
        if time.monotonic() >= deadline: raise RuntimeError('Supervisor nicht nachweisbar eingefroren.')
        time.sleep(.005)
    while True:
        members = descendants(identity['pid'])
        for member in members:
            try: signal_process(member, signal.SIGSTOP)
            except ProcessLookupError: pass
        stable = descendants(identity['pid'])
        frozen = True
        for member in stable:
            try:
                raw = Path(f"/proc/{member['pid']}/stat").read_text()
                if raw[raw.rindex(')') + 2:].split()[0] not in ('T', 't'): frozen = False
            except FileNotFoundError: pass
        if stable == members and frozen: break
        if time.monotonic() >= deadline: raise RuntimeError('Nachkommenschaft nicht stabil eingefroren.')
        time.sleep(.01)
    for member in stable:
        try: signal_process(member, signal.SIGKILL)
        except ProcessLookupError: pass
    while descendants(identity['pid']):
        if time.monotonic() >= deadline: raise RuntimeError('Nachkommenschaft nicht vollständig beendet.')
        time.sleep(.025)
    signal_process(identity, signal.SIGKILL)
    while process_identity(identity['pid']):
        if time.monotonic() >= deadline: raise RuntimeError('Supervisor nicht vollständig beendet.')
        time.sleep(.025)

def literal(value): return "'" + str(value).replace("'", "''") + "'"
def identifier(value): return '"' + str(value).replace('"', '""') + '"'

class Guard:
    def __init__(self, args):
        self.args = args
        self.folder = Path(args.state_dir).absolute()
        self.folder.mkdir(mode=0o700, parents=True, exist_ok=True)
        metadata = self.folder.lstat()
        if stat.S_ISLNK(metadata.st_mode) or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o700:
            raise RuntimeError('Metadatenverzeichnis muss dem Betriebsnutzer gehören und Modus 0700 haben.')
        self.release = self.artifact(Path(args.tool_release or args.release))
        self.record_path = self.folder / 'instance.json'
        self.runtime = os.environ.get('DB_RUNTIME_USER', 'tnbp_runtime')
        self.migrator = os.environ.get('DB_MIGRATION_USER', 'tnbp_migrator')
        self.roles = sorted(set((self.runtime, self.migrator)))
        self.database = None
        self.certifying = False
        self.lifecycle_held = False
        self.db_channel = None
        self.admin_lock_fd = None
        self.url = os.environ.get('DB_URL', 'jdbc:postgresql://localhost:5432/tnbp')
        if 'applicationname=' in self.url.lower() and getattr(args, 'action', None) != 'supervise': raise RuntimeError('DB_URL darf keine fremde Instanzidentität enthalten.')
        forbidden = [name for name in os.environ if name.startswith(('SPRING_DATASOURCE_', 'SPRING_FLYWAY_', 'SPRING_CONFIG_'))
                     or name in ('SPRING_APPLICATION_JSON', 'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS', '_JAVA_OPTIONS')]
        if forbidden: raise RuntimeError('Abweichende Spring-/JVM-Datenbankkonfiguration ist ausgeschlossen: ' + ', '.join(sorted(forbidden)))
        if os.environ.get('DB_ADMIN_USER', 'tnbp_admin') in self.roles:
            raise RuntimeError('Administrativer Zugang muss von Laufzeit und Migration getrennt sein.')

    def bind_database(self):
        if self.sql('SELECT rolsuper FROM pg_roles WHERE rolname=current_user') != 't':
            raise RuntimeError('Vollständiger geschützter Datenbankadministrator erforderlich.')
        parsed = urllib.parse.urlsplit(self.url.removeprefix('jdbc:'))
        if parsed.scheme != 'postgresql' or not parsed.hostname or parsed.username or parsed.password:
            raise RuntimeError('Eindeutiger geheimnisfreier JDBC-Endpunkt erforderlich.')
        options = [(key, value) for key, value in urllib.parse.parse_qsl(parsed.query) if key.lower() != 'applicationname']
        if any(key.lower() in ('user', 'password', 'sslpassword', 'passfile') for key, _ in options):
            raise RuntimeError('JDBC-Endpunkt darf keine Zugangsdaten enthalten; geschützte getrennte Umgebungswerte verwenden.')
        endpoint = {'host': parsed.hostname.lower(), 'port': parsed.port or 5432, 'database': parsed.path,
                    'options_sha256': digest(sorted(options))}
        actual = json.loads(self.sql("SELECT json_build_object('cluster',(pg_control_system()).system_identifier::text,"
            "'database_oid',oid::text,'database',datname,'server_address',inet_server_addr()::text,"
            "'server_port',inet_server_port())::text FROM pg_database WHERE datname=current_database()"))
        self.database = {'endpoint': endpoint, 'identity': actual, 'runtime': self.runtime, 'migrator': self.migrator}
        if (self.folder / 'database.json').exists():
            if self.read('database.json') != self.database:
                raise RuntimeError('Datenbankbindung widerspricht dem gespeicherten Betriebslebenszyklus; kein Stopp oder Wechsel.')
        else:
            if self.record_path.exists() or (self.folder / 'launch.json').exists() or (self.folder / 'admission.json').exists():
                raise RuntimeError('Datenbankbindung des bisherigen Lebenszyklus fehlt.')
            self.write(self.database, 'database.json')
        for name in ('launch.json', 'instance.json', 'lifecycle.json'):
            if (self.folder / name).exists() and self.read(name).get('database') != self.database:
                raise RuntimeError('Prozessnachweis widerspricht der Datenbankbindung.')

    def bind_roles(self):
        # Ein abweichender Login kann über Mitgliedschaften dieselben Rollen
        # annehmen. Erfasse den vollständigen verbundenen Rollengraphen,
        # einschließlich der historischen Standardlogins, unabhängig vom Präfix.
        roots = ','.join(literal(role) for role in {*self.roles, 'tnbp_runtime', 'tnbp_migrator'})
        self.roles = json.loads(self.sql("WITH RECURSIVE connected(oid) AS ("
            "SELECT oid FROM pg_roles WHERE rolname IN (" + roots + ") UNION "
            "SELECT CASE WHEN a.roleid=c.oid THEN a.member ELSE a.roleid END FROM connected c "
            "JOIN pg_auth_members a ON a.roleid=c.oid OR a.member=c.oid) "
            "SELECT coalesce(json_agg(r.rolname ORDER BY r.rolname),'[]'::json)::text FROM connected c JOIN pg_roles r ON r.oid=c.oid "
            "WHERE NOT r.rolsuper AND r.rolname<>" + literal(os.environ.get('DB_ADMIN_USER', 'tnbp_admin'))))
        if self.runtime not in self.roles or self.migrator not in self.roles:
            raise RuntimeError('Konfigurierte Laufzeit-/Migrationsrollen fehlen oder sind privilegiert.')

    @contextlib.contextmanager
    def lock(self):
        descriptor = os.open(self.folder / 'lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(descriptor, 'w') as stream:
            fcntl.flock(stream, fcntl.LOCK_EX)
            # Eine gehaltene JDBC-Verbindung schützt vor der ersten Zustandswahl
            # bis nach Migration und tatsächlicher Instanzbereitschaft dieselbe DB.
            self.db_channel = self.database_channel()
            try:
                if self.db_channel.stdout.readline().strip() != 'READY':
                    raise RuntimeError('Exklusive administrative DB-Sperre fehlt.')
                if self.sql('SELECT rolsuper FROM pg_roles WHERE rolname=current_user') != 't':
                    raise RuntimeError('Vollständiger geschützter Datenbankadministrator erforderlich.')
                identity = json.loads(self.sql("SELECT json_build_object('cluster',(pg_control_system()).system_identifier::text,'database',oid::text)::text FROM pg_database WHERE datname=current_database()"))
                shared = Path('/tmp/tnbp-api-release-locks')
                shared.mkdir(mode=0o700, exist_ok=True)
                metadata = shared.lstat()
                if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o700:
                    raise RuntimeError('Gemeinsame administrative Sperre gehört einem anderen Betriebsnutzer oder ist ungeschützt.')
                descriptor = os.open(shared / digest(identity), os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
                self.admin_lock_fd = descriptor
                metadata = os.fstat(descriptor)
                if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o600:
                    raise RuntimeError('Gemeinsame administrative Sperrdatei ist ungeschützt.')
                fcntl.flock(descriptor, fcntl.LOCK_EX)
                self.bind_database()
                self.bind_roles()
                yield
            finally:
                channel, self.db_channel = self.db_channel, None
                if channel.poll() is None:
                    try: channel.stdin.write('QUIT\n'); channel.stdin.flush()
                    except (BrokenPipeError, OSError): pass
                channel.communicate()
                if self.admin_lock_fd is not None:
                    os.close(self.admin_lock_fd)
                    self.admin_lock_fd = None

    def read(self, name='instance.json'):
        path = self.folder / name
        metadata = path.lstat()
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o600:
            raise RuntimeError('Geschützte reguläre Metadatendatei (0600) erforderlich.')
        return json.loads(path.read_text())

    def write(self, value, name='instance.json'):
        if name in ('instance.json', 'launch.json') and self.database is not None:
            value = {**value, 'database': self.database}
        descriptor, temporary = tempfile.mkstemp(dir=self.folder)
        try:
            with os.fdopen(descriptor, 'w') as output:
                json.dump(value, output, sort_keys=True)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, self.folder / name)
            self.sync_directory()
        finally:
            if os.path.exists(temporary): os.unlink(temporary)

    def sync_directory(self):
        directory = os.open(self.folder, os.O_RDONLY | os.O_DIRECTORY)
        try: os.fsync(directory)
        finally: os.close(directory)

    def remove_certificate(self):
        certificate = self.folder / 'rollback.json'
        if certificate.exists():
            self.read('rollback.json')
            certificate.unlink()
            self.sync_directory()

    def artifact(self, source):
        # Der laufende Prozess und seine Migration verwenden dieselben
        # unveränderlichen Bytes, auch wenn der ursprüngliche Buildpfad neu baut.
        source = Path(source).resolve(strict=True)
        descriptor, temporary = tempfile.mkstemp(dir=self.folder)
        try:
            checksum = hashlib.sha256()
            with source.open('rb') as original, os.fdopen(descriptor, 'wb') as output:
                while chunk := original.read(1024 * 1024):
                    checksum.update(chunk); output.write(chunk)
                output.flush(); os.fsync(output.fileno())
            value = checksum.hexdigest()
            if release_hash(source) != value: raise RuntimeError('Release während Bindung verändert.')
            destination = self.folder / ('release-' + value + '.jar')
            if destination.exists():
                metadata = destination.lstat()
                if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) != 0o400 or release_hash(destination) != value:
                    raise RuntimeError('Geschützte Releasekopie ist widersprüchlich.')
            else:
                os.chmod(temporary, 0o400); os.replace(temporary, destination)
            return destination
        finally:
            if os.path.exists(temporary): os.unlink(temporary)

    def database_channel(self):
        # Der JDBC-Treiber stammt aus dem exakt angegebenen geprüften Werkzeugrelease.
        with zipfile.ZipFile(self.release) as jar:
            drivers = [name for name in jar.namelist() if name.startswith('BOOT-INF/lib/postgresql-') and name.endswith('.jar')]
            if len(drivers) != 1: raise RuntimeError('Eindeutiger JDBC-Treiber im Werkzeugrelease erforderlich.')
            driver = self.folder / 'postgresql.jar'
            data = jar.read(drivers[0])
            if not driver.exists() or driver.read_bytes() != data:
                descriptor = os.open(driver, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
                with os.fdopen(descriptor, 'wb') as output: output.write(data)
        environment = os.environ.copy()
        url = self.url + ('&' if '?' in self.url else '?') + 'ApplicationName=tnbp-release-guard-' + str(uuid.uuid4())
        environment['RELEASE_DB_URL'] = url
        environment.setdefault('DB_ADMIN_USER', 'tnbp_admin')
        if not environment.get('DB_ADMIN_PASSWORD'): raise RuntimeError('Geschützter administrativer Datenbankzugang fehlt.')
        return subprocess.Popen([java(), '--class-path', str(driver), str(ROOT / 'scripts/ApiReleaseDatabase.java'), 'session'],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=environment)

    def sql(self, sql):
        channel = self.db_channel
        if channel is None or channel.poll() is not None:
            raise RuntimeError('Administrative DB-Sperrverbindung fehlt; keine Fortsetzung oder Wiederverbindung.')
        try:
            channel.stdin.write(base64.b64encode(sql.encode()).decode() + '\n')
            channel.stdin.flush()
            status, _, encoded = channel.stdout.readline().strip().partition(' ')
        except (BrokenPipeError, OSError) as failure:
            raise RuntimeError('Administrative DB-Sperrverbindung verloren; keine Fortsetzung.') from failure
        if status != 'OK':
            detail = base64.b64decode(encoded).decode() if encoded else 'Sperrverbindung verloren'
            raise RuntimeError('Administrative Datenbankprüfung fehlgeschlagen; kein Übergang bestätigt; keine Fortsetzung oder Wiederverbindung. ' + detail)
        return base64.b64decode(encoded).decode().strip()

    def snapshot(self):
        data = json.loads(self.sql(SNAPSHOT))
        # NOLOGIN ist die vorübergehende Admission-Sperre, kein fachlicher
        # Rollendrift. Der Beleg bindet die unmittelbar bei Commit wiederhergestellten Werte.
        if (self.folder / 'admission.json').exists():
            original = self.read('admission.json')
            for role in data['roles']['roles']:
                if role['rolname'] in original: role['rolcanlogin'] = original[role['rolname']]
        return {key: digest(data[key]) for key in ('schema', 'roles')}

    def state(self):
        exists = self.sql("SELECT to_regclass('api_version.state') IS NOT NULL") == 't'
        history = self.sql("SELECT to_regclass('access.flyway_schema_history') IS NOT NULL") == 't'
        migrated = history and self.sql("SELECT EXISTS(SELECT FROM access.flyway_schema_history WHERE success AND version ~ '^[0-9]+(\\.[0-9]+)*$' AND split_part(version,'.',1)::integer >= 10)") == 't'
        if not exists:
            if migrated: raise RuntimeError('V10 ist verzeichnet, aber der Versionszustand fehlt; Start gesperrt.')
            return None
        if not migrated: raise RuntimeError('Versionszustand ohne bestätigte V10-Migration; Start gesperrt.')
        rows = json.loads(self.sql('SELECT coalesce(json_agg(s),\'[]\'::json)::text FROM api_version.state s'))
        if len(rows) != 1 or rows[0].get('singleton') is not True:
            raise RuntimeError('Eindeutiger Versionszustand fehlt.')
        state = rows[0]
        if any(type(state.get(field)) is not bool for field in ('v1_retired', 'signed_progress_used', 'monthly_effects_used')):
            raise RuntimeError('Unvollständiger Versionszustand.')
        if (state['signed_progress_used'] or state['monthly_effects_used']) and not state['v1_retired']:
            raise RuntimeError('Nutzungsmarker widersprechen der Versionsgrenze.')
        if state['v1_retired'] or any(state.get(field) is not None for field in ('stopped_instance', 'retired_at', 'release_sha256', 'schema_sha256', 'roles_sha256')):
            if state.get('retired_at') is None or any(not isinstance(state.get(field), str) or not re.fullmatch('[0-9a-f]{64}', state[field])
                    for field in ('release_sha256', 'schema_sha256', 'roles_sha256')):
                raise RuntimeError('Vollständiger Stilllegungsbeleg erforderlich.')
            uuid.UUID(state['stopped_instance'])
        return state

    def sessions(self):
        roles = ','.join(literal(role) for role in self.roles)
        return json.loads(self.sql("SELECT coalesce(json_agg(x),'[]'::json)::text FROM "
            "(SELECT pid,application_name,usename,state FROM pg_stat_activity WHERE pid<>pg_backend_pid() "
            "AND ((datname=current_database() AND (usename IN (" + roles + ") OR application_name LIKE 'tnbp-api-%')) "
            "OR (backend_type='client backend' AND usename IS NULL))) x"))

    def close_admission(self):
        if self.sql('SELECT rolsuper FROM pg_roles WHERE rolname=current_user') != 't':
            raise RuntimeError('Vollständiger geschützter Datenbankadministrator erforderlich.')
        path = self.folder / 'admission.json'
        if path.exists():
            original = self.read('admission.json')
            if set(original) != set(self.roles): raise RuntimeError('Admissionrollen widersprechen der Konfiguration.')
        else:
            roles = ','.join(literal(role) for role in self.roles)
            rows = json.loads(self.sql("SELECT coalesce(json_object_agg(rolname,rolcanlogin),'{}'::json)::text FROM pg_roles WHERE rolname IN (" + roles + ")"))
            if set(rows) != set(self.roles) or not rows.get(self.runtime) or not rows.get(self.migrator): raise RuntimeError('Konfigurierte Loginrollen fehlen oder sind ungeklärt gesperrt.')
            self.write(rows, 'admission.json')
        # Voller Administrator ist absichtlich erforderlich. Der Zustand bleibt
        # bei jedem Fehler geschlossen und ist erst beim endgültigen Commit offen.
        self.sql('BEGIN;' + ''.join('ALTER ROLE ' + identifier(role) + ' NOLOGIN;' for role in self.roles) + 'COMMIT;')

    def assert_closed(self):
        roles = ','.join(literal(role) for role in self.roles)
        if self.sql('SELECT count(*)=0 FROM pg_roles WHERE rolname IN (' + roles + ') AND rolcanlogin') != 't':
            raise RuntimeError('Datenbank-Admission ist nicht geschlossen.')

    def release_admission_sql(self):
        return ''.join('ALTER ROLE ' + identifier(role) + (' LOGIN;' if allowed else ' NOLOGIN;')
                       for role, allowed in self.read('admission.json').items())

    def confirm(self, retired=None, record=None, target=None, snapshot=None):
        self.assert_closed()
        if self.sessions(): raise RuntimeError('Datenbankarbeit vor Bestätigung nicht vollständig beendet.')
        roles = ','.join(literal(role) for role in self.roles)
        # NOLOGIN bleibt bis zu diesem einen Commit wirksam. Die letzte
        # DB-Prüfung und die Bestätigung teilen dieselbe administrative Transaktion.
        sql = "BEGIN; DO $$ BEGIN IF EXISTS(SELECT FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND datname=current_database() AND (usename IN (" + roles + ") OR application_name LIKE 'tnbp-api-%')) THEN RAISE EXCEPTION 'Ungeklärte Datenbankarbeit'; END IF; END $$;"
        if retired is not None:
            sql += "SELECT api_version.set_retirement(" + ('true' if retired else 'false') + ',' + literal(uuid.UUID(record['instance'])) + ',' + literal(release_hash(target)) + ',' + literal(snapshot['schema']) + ',' + literal(snapshot['roles']) + ');'
        self.sql(sql + self.release_admission_sql() + 'COMMIT;')
        (self.folder / 'admission.json').unlink()

    def lifecycle(self, active=None):
        if self.sql("SELECT to_regclass('api_version.lifecycle') IS NOT NULL") != 't':
            if self.state() is not None: raise RuntimeError('DB-gebundener Lebenszyklusnachweis fehlt.')
            return
        owner = digest(str(self.folder.resolve()))
        if active is None:
            if self.sql('SELECT active FROM api_version.lifecycle WHERE singleton') != 'f':
                raise RuntimeError('Registrierter DB-Lebenszyklus ist noch aktiv; Start/Prüfung gesperrt.')
        elif active:
            # Vor dem DB-Erwerb dauerhaft: auch ein Hostneustart vor Spawn oder
            # Supervisorregistrierung hat damit einen gebundenen Boot-/Eigentumsbeleg.
            self.write({'database': self.database, 'owner': owner, 'controller': process_identity(os.getpid()),
                        'instance': None, 'application': None}, 'lifecycle.json')
            if self.sql("UPDATE api_version.lifecycle SET active=true,owner_sha256=" + literal(owner) + " WHERE singleton AND NOT active RETURNING active") != 't':
                raise RuntimeError('Anderer registrierter DB-Lebenszyklus verhindert den Start.')
        else:
            if self.sql("UPDATE api_version.lifecycle SET active=false WHERE singleton AND (NOT active OR owner_sha256=" + literal(owner) + ') RETURNING active') != 'f':
                raise RuntimeError('DB-Lebenszyklus gehört zu einem anderen Metadatenverzeichnis.')

    def recover_lifecycle(self):
        path = self.folder / 'lifecycle.json'
        if not path.exists(): return False
        proof = self.read('lifecycle.json')
        controller = proof.get('controller')
        if not isinstance(controller, dict) or not controller.get('boot'):
            raise RuntimeError('Bootnachweis des registrierten Lebenszyklus fehlt.')
        if controller['boot'] == boot_id(): return False
        rows = json.loads(self.sql("SELECT coalesce(json_agg(x),'[]'::json)::text FROM "
            "(SELECT active,owner_sha256 FROM api_version.lifecycle WHERE singleton) x"))
        if len(rows) != 1: raise RuntimeError('Eindeutiger DB-Lebenszyklus fehlt.')
        if not rows[0]['active']: return False
        owner = digest(str(self.folder.resolve()))
        if proof.get('database') != self.database or proof.get('owner') != owner or rows[0]['owner_sha256'] != owner:
            raise RuntimeError('Alter Bootnachweis gehört nicht zum aktiven DB-Lebenszyklus; Wiederanlauf gesperrt.')
        record = self.read() if self.record_path.exists() else None
        if record and proof.get('instance') == record.get('instance'):
            if not self.previous_boot(record) or record['supervisor']['boot'] != controller['boot']:
                raise RuntimeError('Widersprüchliche Bootnachweise.')
        self.close_admission()
        sessions = self.sessions()
        if any(row['application_name'] != proof.get('application') for row in sessions):
            raise RuntimeError('Nicht zugeordnete Datenbankarbeit nach Hostneustart; Wiederanlauf gesperrt.')
        for row in sessions:
            if self.sql(f"SELECT pg_terminate_backend({int(row['pid'])},5000)") != 't':
                raise RuntimeError('Datenbankarbeit nach Hostneustart konnte nicht beendet werden.')
        if self.sessions(): raise RuntimeError('Datenbankarbeit nach Hostneustart nicht vollständig beendet.')
        self.assert_closed()
        self.lifecycle(False)
        proof['recovered_boot'] = boot_id()
        self.write(proof, 'lifecycle.json')
        if record and proof.get('instance') == record.get('instance'):
            record.update(stopped=True, containment_stopped=True, recovered_boot=boot_id())
            self.write(record)
        return True

    def previous_boot(self, record):
        identities = (record.get('supervisor'), record.get('process'))
        if any(not isinstance(identity, dict) or not identity.get('boot') for identity in identities):
            raise RuntimeError('Vollständiger Bootidentitätsnachweis fehlt.')
        if identities[0]['boot'] != identities[1]['boot']:
            raise RuntimeError('Widersprüchlicher Bootidentitätsnachweis.')
        return identities[0]['boot'] != boot_id()

    def no_process(self):
        self.recover_lifecycle()
        if self.record_path.exists() and self.previous_boot(self.read()) and not self.read().get('stopped'):
            self.stop()
        if not self.certifying: self.lifecycle()
        if self.record_path.exists():
            record = self.read()
            supervisor = record.get('supervisor')
            if supervisor is None: raise RuntimeError('Vollständiger Containmentnachweis fehlt.')
            old_boot = self.previous_boot(record)
            current = None if old_boot else process_identity(supervisor['pid'])
            if current == supervisor: raise RuntimeError('Registrierter Supervisor/API-Prozess lebt noch.')
            if not (record.get('contained_exit') or record.get('containment_stopped')):
                raise RuntimeError('Ungeklärtes Ende des registrierten Containments; Start/Prüfung gesperrt.')
            if not old_boot and process_identity(record['process']['pid']) == record['process']: raise RuntimeError('Registrierter API-Prozess lebt noch.')
        if self.sessions(): raise RuntimeError('Ungeklärte vorherige Datenbankarbeit verhindert Start/Prüfung.')

    def assert_owner(self):
        if self.sql("SELECT to_regclass('api_version.lifecycle') IS NOT NULL") != 't': return
        rows = json.loads(self.sql("SELECT coalesce(json_agg(x),'[]'::json)::text FROM (SELECT active,owner_sha256 FROM api_version.lifecycle WHERE singleton) x"))
        if len(rows) != 1 or (rows[0]['active'] and rows[0]['owner_sha256'] != digest(str(self.folder.resolve()))):
            raise RuntimeError('Aktiver DB-Lebenszyklus gehört zu einem anderen Metadatenverzeichnis; kein Stopp oder Admissionwechsel.')

    def stop(self):
        self.assert_owner()
        if self.recover_lifecycle():
            if self.record_path.exists() and self.read().get('stopped') and self.read().get('instance') == self.read('lifecycle.json').get('instance'): return self.read()
            return None
        self.close_admission()
        record = self.read()
        identity = record['process']
        previous_boot = self.previous_boot(record)
        current = None if previous_boot else process_identity(identity['pid'])
        if current and current != identity and not (record.get('contained_exit') or record.get('containment_stopped')): raise RuntimeError('Prozessidentität stimmt nicht; Wechsel gesperrt.')
        if not record.get('supervisor'): raise RuntimeError('Registrierter Subreaper fehlt.')
        if not previous_boot and not process_identity(record['supervisor']['pid']) and not (record.get('contained_exit') or record.get('containment_stopped')):
            raise RuntimeError('Supervisor ohne vollständigen Abschlussnachweis verschwunden.')
        supervisor_now = None if previous_boot else process_identity(record['supervisor']['pid'])
        if supervisor_now == record['supervisor']: end_containment(record['supervisor'], self.args.timeout)
        elif supervisor_now and not (record.get('contained_exit') or record.get('containment_stopped')):
            raise RuntimeError('Supervisor ohne vollständigen Abschlussnachweis ersetzt.')
        if not previous_boot and process_identity(identity['pid']) == identity: raise RuntimeError('API nicht vollständig beendet.')
        record['containment_stopped'] = True
        self.write(record)
        sessions = self.sessions()
        unknown = [row for row in sessions if row['application_name'] != record['application']]
        if unknown: raise RuntimeError('Nicht zugeordnete Datenbankarbeit; Wechsel gesperrt.')
        for row in sessions:
            if self.sql(f"SELECT pg_terminate_backend({int(row['pid'])}, 5000)") != 't':
                raise RuntimeError('Datenbankprozess konnte nicht beendet werden.')
        if self.sessions(): raise RuntimeError('Datenbankarbeit noch nicht vollständig beendet.')
        self.assert_closed()
        if not self.certifying: self.lifecycle(False)
        if previous_boot: record['recovered_boot'] = boot_id()
        record['stopped'] = True
        self.write(record)
        return record

    def migrate(self, target):
        if not supports_retirement(target): return
        self.assert_closed()
        environment = os.environ.copy()
        environment.pop('SPRING_MAIN_SOURCES', None)
        environment['DB_URL'] = self.url + ('&' if '?' in self.url else '?') + 'ApplicationName=tnbp-api-migration-' + str(uuid.uuid4())
        # Das exakt gebundene Artefakt migriert ohne Webserver oder Fachbeans.
        result = subprocess.run([java(), '-jar', str(target), '--api.version.migrate-only=true'], env=environment, pass_fds=(self.admin_lock_fd,))
        if result.returncode: raise RuntimeError('Administrative Migration fehlgeschlagen; Admission bleibt geschlossen.')
        self.assert_closed()
        if self.sessions(): raise RuntimeError('Migrationsphase hat ungeklärte Datenbankarbeit hinterlassen.')

    def transition(self, retired):
        target = self.artifact(self.args.release)
        state = self.state()
        if state is None: raise RuntimeError('V10 muss vor dem Wechsel im Kompatibilitätsmodus angewendet sein.')
        snapshot = self.snapshot()
        if not retired:
            if state['signed_progress_used'] or state['monthly_effects_used']:
                raise RuntimeError('Rücknahme nach technischer Nutzung dauerhaft ausgeschlossen.')
            if self.read('rollback.json') != {'release': release_hash(target), **snapshot}:
                raise RuntimeError('Rücknahmerelease ist nicht gegen genau dieses Schema und diese Rollen geprüft.')
        elif not supports_retirement(target): raise RuntimeError('Zielrelease kennt die Versionsbarriere nicht.')
        record = self.stop()
        if record is None: raise RuntimeError('Vorprozessstart beendet; Stilllegung benötigt zuerst einen registrierten API-Start.')
        if self.snapshot() != snapshot: raise RuntimeError('Schema/Rollen haben sich während des Stopps geändert.')
        if retired: self.migrate(target)
        snapshot = self.snapshot()
        self.confirm(retired, record, target, snapshot)
        print('Stilllegung bestätigt.' if retired else 'Geprüfte Rücknahme bestätigt; Finanzdaten unverändert.')

    def environment(self, instance, mode):
        environment = os.environ.copy()
        application = 'tnbp-api-' + instance
        url = self.url + ('&' if '?' in self.url else '?') + 'ApplicationName=' + application
        environment.update(DB_URL=url, API_INSTANCE_ID=instance, API_VERSION_MODE=mode)
        return environment, application, url

    def launch(self, target, mode, ready_url):
        instance = str(uuid.uuid4())
        environment, application, url = self.environment(instance, mode)
        environment['API_RELEASE_SHA256'] = release_hash(target)
        # Der Webprozess benötigt ausschließlich den unprivilegierten Zugang.
        environment.pop('DB_ADMIN_PASSWORD', None)
        environment.pop('DB_MIGRATION_PASSWORD', None)
        configuration = {'instance': instance, 'application': application, 'release': release_hash(target),
            'target': str(target), 'url': url, 'mode': mode, 'controller': process_identity(os.getpid())}
        self.write(configuration, 'launch.json')
        child = None
        identity = None
        if not self.lifecycle_held:
            self.lifecycle(True)
            self.lifecycle_held = True
        try:
            proof = self.read('lifecycle.json')
            proof.update(instance=instance, application=application)
            self.write(proof, 'lifecycle.json')
            fresh = self.state()
            expected_mode = 'retired' if fresh and fresh['v1_retired'] else 'compatible'
            if not self.certifying and mode != expected_mode:
                raise RuntimeError('Startmodus widerspricht frisch geprüftem dauerhaftem Versionszustand.')
            if not supports_retirement(target):
                if fresh is None or fresh['signed_progress_used'] or fresh['monthly_effects_used']:
                    raise RuntimeError('Altstart nach technischer Nutzung dauerhaft ausgeschlossen.')
                if not self.certifying and self.read('rollback.json') != {'release': release_hash(target), **self.snapshot()}:
                    raise RuntimeError('Altstart benötigt einen aktuellen exakten Rücknahmebeleg.')
            child = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), 'supervise', '--release', str(target),
                '--tool-release', str(self.release), '--state-dir', str(self.folder)], env=environment, start_new_session=True)
            identity = process_identity(child.pid)
            if identity is None: raise RuntimeError('Supervisor vor Registrierung beendet.')
            deadline = time.monotonic() + self.args.timeout
            while child.poll() is None and time.monotonic() < deadline:
                if self.record_path.exists():
                    record = self.read()
                    if record.get('instance') == instance and record.get('process') and not record.get('pending') and self.ready(record, ready_url):
                        return child, record
                time.sleep(.1)
            raise RuntimeError('Erfolgreiche instanzgebundene v2-Bereitschaft fehlt.')
        except BaseException:
            if identity: end_containment(identity, self.args.timeout)
            if child: child.wait()
            self.close_admission()
            # Ein Fehler vor Persistierung wird über die lokal bekannte Identität
            # genauso aufgeräumt wie ein registrierter Start.
            for row in self.sessions():
                if row['application_name'] != application: raise RuntimeError('Unbekannte DB-Arbeit nach fehlgeschlagenem Start.')
                self.sql(f"SELECT pg_terminate_backend({int(row['pid'])},5000)")
            if self.sessions(): raise RuntimeError('Ungeklärte Datenbankarbeit nach Startfehler.')
            failed = self.read() if self.record_path.exists() else None
            if failed is not None and failed.get('instance') == instance:
                failed.update(stopped=True, containment_stopped=True)
                self.write(failed)
            elif identity is not None:
                # Auch vor der ersten Supervisorpersistierung ist die konkret
                # eingefrorene/beendete Nachkommenschaft vollständig belegt.
                self.write({'instance': instance, 'application': application, 'release': release_hash(target),
                    'supervisor': identity, 'process': identity, 'stopped': True, 'containment_stopped': True})
            if not self.certifying: self.lifecycle(False)
            raise

    def ready(self, record, ready_url):
        parsed = urllib.parse.urlsplit(ready_url)
        if parsed.scheme != 'http' or parsed.hostname not in ('localhost', '127.0.0.1', '::1') or parsed.path != '/api/v2/access/csrf':
            raise RuntimeError('Bereitschaft benötigt den lokalen festen v2-Probeaufruf.')
        port = parsed.port or 80
        def owned(inodes):
            if process_identity(record['process']['pid']) != record['process']: return False
            processes = [record['process'], *descendants(record['process']['pid'])]
            targets = {'socket:[' + inode + ']' for inode in inodes}
            for process in processes:
                try:
                    for descriptor in Path(f"/proc/{process['pid']}/fd").iterdir():
                        try:
                            if os.readlink(descriptor) in targets: return True
                        except FileNotFoundError: pass
                except FileNotFoundError: pass
            return False
        def bound():
            inodes = set()
            for table in ('tcp', 'tcp6'):
                for line in Path('/proc/net/' + table).read_text().splitlines()[1:]:
                    fields = line.split()
                    if fields[3] == '0A' and int(fields[1].split(':')[1], 16) == port: inodes.add(fields[9])
            return owned(inodes)
        def address(value, table):
            host, port_hex = value.split(':')
            raw = bytes.fromhex(host)
            raw = b''.join(raw[index:index+4][::-1] for index in range(0, len(raw), 4))
            parsed_address = ipaddress.ip_address(raw)
            if isinstance(parsed_address, ipaddress.IPv6Address) and parsed_address.ipv4_mapped:
                parsed_address = parsed_address.ipv4_mapped
            return str(parsed_address), int(port_hex, 16)
        def accepted_by_instance(client, peer):
            # Auch gleiche Portnummern an verschiedenen Adressen/Familien dürfen
            # die fremde HTTP-Antwort nicht an den registrierten Listener binden.
            inodes = set()
            for table in ('tcp', 'tcp6'):
                for line in Path('/proc/net/' + table).read_text().splitlines()[1:]:
                    fields = line.split()
                    if fields[3] == '01' and address(fields[1], table) == peer and address(fields[2], table) == client:
                        inodes.add(fields[9])
            return owned(inodes)
        if not bound(): return False
        connection = http.client.HTTPConnection(parsed.hostname, port, timeout=1)
        try:
            connection.connect()
            client = connection.sock.getsockname()[:2]
            peer = connection.sock.getpeername()[:2]
            connection.request('GET', '/api/v2/access/csrf', headers={'Cache-Control': 'no-cache'})
            response = connection.getresponse()
            attached = accepted_by_instance(client, peer)
            data = json.load(response)
            return attached and response.status == 200 and isinstance(data.get('token'), str) and bool(data['token']) and bound()
        except (OSError, ValueError, http.client.HTTPException): return False
        finally: connection.close()

    def start(self):
        target = self.artifact(self.args.release)
        child, record = None, None
        def interrupted(signum, frame): raise KeyboardInterrupt
        previous = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGINT, signal.SIGTERM)}
        try:
            with self.lock():
                self.no_process()
                state = self.state()
                if state is None and not supports_retirement(target):
                    raise RuntimeError('Ein Altstart ohne eindeutigen Versionszustand ist ausgeschlossen; nur der neue Release darf V10 initialisieren.')
                mode = 'retired' if state and state['v1_retired'] else 'compatible'
                configured = os.environ.get('API_VERSION_MODE')
                if configured and configured != mode: raise RuntimeError('Konfiguration widerspricht dauerhaftem Versionszustand.')
                snapshot = self.snapshot() if state else None
                if mode == 'retired':
                    if not supports_retirement(target) or release_hash(target) != state['release_sha256']:
                        raise RuntimeError('Release passt nicht zum bestätigten Stilllegungszustand; Folgerelease über retire migrieren.')
                    if snapshot != {'schema': state['schema_sha256'], 'roles': state['roles_sha256']}:
                        raise RuntimeError('Schema-/Rollenzustand weicht vom Nachweis ab.')
                elif state and not supports_retirement(target):
                    if self.read('rollback.json') != {'release': release_hash(target), **snapshot}:
                        raise RuntimeError('Jeder ältere Start auf migriertem Zustand benötigt den exakt geprüften Rücknahmerelease.')
                self.close_admission()
                self.migrate(target)
                if state and mode == 'retired' and self.snapshot() != snapshot:
                    raise RuntimeError('Unerwartete Migration beim Neustart; Folgerelease über retire bestätigen.')
                self.confirm()
                child, record = self.launch(target, mode, self.args.ready_url)
            print('API über v2 bereit (' + mode + ').', flush=True)
            return child.wait()
        finally:
            for sig, handler in previous.items(): signal.signal(sig, handler)
            if child:
                with self.lock():
                    current = self.read()
                    if current['instance'] == record['instance'] and not current.get('stopped'): self.stop()
                child.wait()

    def supervise(self):
        if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
            raise RuntimeError('Linux-Subreaper konnte nicht eingerichtet werden.')
        configuration = self.read('launch.json')
        self.database = configuration['database']
        controller = configuration.get('controller')
        if not isinstance(controller, dict) or os.getppid() != controller.get('pid') or process_identity(controller['pid']) != controller:
            raise RuntimeError('Interner Supervisorstart benötigt den registrierten lebenden Guard-Elternprozess.')
        supervisor = process_identity(os.getpid())
        child = None
        try:
            self.write({key: configuration[key] for key in ('instance', 'application', 'release')} |
                {'supervisor': supervisor, 'process': supervisor, 'stopped': False, 'pending': True})
            child = subprocess.Popen([java(), '-jar', configuration['target'],
                '--spring.datasource.url=' + configuration['url'], '--spring.flyway.enabled=false',
                '--spring.datasource.username=' + self.runtime, '--api.version.mode=' + configuration['mode'],
                '--api.version.instance-id=' + configuration['instance'], '--api.version.release-sha256=' + configuration['release']])
            identity = process_identity(child.pid)
            if identity is None: raise RuntimeError('API vor Registrierung beendet.')
            self.write({key: configuration[key] for key in ('instance', 'application', 'release')} |
                {'supervisor': supervisor, 'process': identity, 'stopped': False})
            return child.wait()
        finally:
            # Auch Schreib-/Registrierungsfehler nach Spawn bleiben im
            # Subreaper. Kinder zuerst stabil einfrieren, dann vollständig reapen.
            while True:
                members = descendants(os.getpid())
                for member in members:
                    try: signal_process(member, signal.SIGSTOP)
                    except ProcessLookupError: pass
                stable = descendants(os.getpid())
                frozen = True
                for member in stable:
                    try:
                        raw = Path(f"/proc/{member['pid']}/stat").read_text()
                        if raw[raw.rindex(')') + 2:].split()[0] not in ('T', 't'): frozen = False
                    except FileNotFoundError: pass
                if stable == members and frozen:
                    for member in stable:
                        try: signal_process(member, signal.SIGKILL)
                        except ProcessLookupError: pass
                    break
            while True:
                try: os.waitpid(-1, 0)
                except ChildProcessError: break
            if self.record_path.exists():
                record = self.read()
                if record.get('instance') == configuration['instance']:
                    record['contained_exit'] = True
                    self.write(record)

    def certify(self):
        # Eine alte Freigabe wird vor jeder neuen Prüfung entzogen, auch wenn
        # schon Vorbedingungen oder die eigentliche Prüfung fehlschlagen.
        certificate = self.folder / 'rollback.json'
        self.remove_certificate()
        target = self.artifact(self.args.release)
        state = self.state()
        if state is None or state['signed_progress_used'] or state['monthly_effects_used']:
            raise RuntimeError('Altprüfung ohne eindeutigen ungenutzten Versionszustand ausgeschlossen.')
        self.no_process()
        self.lifecycle(True)
        self.lifecycle_held = True
        self.certifying = True
        try:
            fresh = self.state()
            if fresh is None or fresh['signed_progress_used'] or fresh['monthly_effects_used']:
                raise RuntimeError('Altstart nach technischer Nutzung dauerhaft ausgeschlossen.')
            self.close_admission()
            before = self.snapshot()
            self.confirm()
            import importlib.util
            specification = importlib.util.spec_from_file_location('rollback_check', ROOT / 'scripts/check-rollback-release.py')
            module = importlib.util.module_from_spec(specification); specification.loader.exec_module(module)
            fresh = self.state()
            if fresh is None or fresh['signed_progress_used'] or fresh['monthly_effects_used']:
                raise RuntimeError('Altstart nach technischer Nutzung dauerhaft ausgeschlossen.')
            module.run_check(self, target, self.args.check_port)
            if self.snapshot() != before: raise RuntimeError('Prüfung hat Schema/Rollen verändert.')
            self.no_process()
            self.confirm()
            self.write({'release': release_hash(target), **before}, 'rollback.json')
            self.lifecycle(False)
            self.lifecycle_held = False
            print('Rücknahmekandidat gegen exakten Schema-/Rollenzustand geprüft.')
        except BaseException:
            self.remove_certificate()
            try:
                self.close_admission()
            except RuntimeError:
                pass  # Frühfehler dürfen den ursprünglichen Fehler nicht verdecken.
            try:
                self.no_process()
            except RuntimeError:
                pass  # Ungeklärter Prozessabschluss hält den DB-Lebenszyklus geschlossen.
            else:
                self.lifecycle(False)
                self.lifecycle_held = False
            raise
        finally:
            self.certifying = False

def java():
    return str(Path(os.environ['JAVA_HOME']) / 'bin/java') if os.environ.get('JAVA_HOME') else 'java'

def supports_retirement(path):
    with zipfile.ZipFile(path) as jar:
        return 'BOOT-INF/classes/de/linus/tnbp/shared/ApiVersionState.class' in jar.namelist()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('start', 'stop', 'retire', 'rollback', 'certify-rollback', 'snapshot', 'supervise'))
    parser.add_argument('--release', required=True)
    parser.add_argument('--tool-release')
    parser.add_argument('--state-dir', default=str(ROOT / '.local/api-release'))
    parser.add_argument('--ready-url', default='http://127.0.0.1:8080/api/v2/access/csrf')
    parser.add_argument('--timeout', type=float, default=60)
    parser.add_argument('--check-port', type=int, default=18081)
    args = parser.parse_args()
    os.umask(0o077)
    guard = Guard(args)
    if args.action == 'start': return guard.start()
    if args.action == 'supervise': return guard.supervise()
    with guard.lock():
        if args.action == 'stop': guard.stop()
        elif args.action == 'snapshot': print(json.dumps(guard.snapshot(), sort_keys=True))
        elif args.action == 'certify-rollback': guard.certify()
        else: guard.transition(args.action == 'retire')
    return 0

if __name__ == '__main__':
    try: sys.exit(main())
    except KeyboardInterrupt: sys.exit(130)
    except (RuntimeError, OSError, ValueError, subprocess.CalledProcessError) as failure:
        print(str(failure), file=sys.stderr)
        sys.exit(1)
