#!/usr/bin/env python3
"""Isolierte Prüfung des Altartefakts gegen das vorhandene Schema und dessen Rollen.

Nur auf einem synthetischen Prüfbestand ausführen; Listener ausschließlich Loopback.
"""
import argparse
import base64
import hashlib
import hmac
import importlib.util
import json
import os
from http.cookies import SimpleCookie
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]

def run_check(guard, target, port):
    token = 'a' * 43
    emails = ['rollback-' + str(uuid.uuid4()) + '@example.org' for _ in range(2)]
    password = 'Synthetisches Prüfpasswort 🦊'
    origin = 'https://localhost:4200'
    url = 'http://127.0.0.1:' + str(port)
    previous = os.environ.copy()
    environment = os.environ.copy()
    environment.update(SESSION_SIGNING_KEY=base64.b64encode(bytes(32)).decode(), SESSION_ISSUER='rollback-check',
        SESSION_AUDIENCE='rollback-check-spa', SESSION_ORIGIN=origin, REGISTRATION_LINK_ENABLED='true',
        REGISTRATION_LINK_SHA256=hashlib.sha256(token.encode()).hexdigest(),
        REGISTRATION_LINK_ISSUED_AT=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    environment.pop('SPRING_MAIN_SOURCES', None)
    environment.update(SERVER_ADDRESS='127.0.0.1', SERVER_PORT=str(port))
    os.environ.clear(); os.environ.update(environment)
    process = None
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    def call(method, path, body=None, headers=None, expected=200):
        request_headers = {'Content-Type': 'application/json', **(headers or {})}
        request = urllib.request.Request(url + '/api/v1' + path,
            data=None if body is None else json.dumps(body).encode(), headers=request_headers, method=method)
        try: response = opener.open(request, timeout=3)
        except urllib.error.HTTPError as failure: response = failure
        if response.status != expected: raise RuntimeError(str((method, path, response.status, response.read().decode())))
        if path != '/access/registrations' and response.headers.get('Cache-Control') != 'no-store': raise RuntimeError('no-store fehlt')
        raw = response.read()
        return (json.loads(raw) if raw else None), response.headers
    def require(condition, message):
        if not condition: raise RuntimeError(message)
    def refresh_cookie(headers, deleted=False, lifetime=(2592000, 2592000)):
        values = [value for value in headers.get_all('Set-Cookie', []) if value.startswith('__Host-tnbp-refresh=')]
        require(len(values) == 1, 'Eindeutiges Refresh-Cookie fehlt')
        parsed = SimpleCookie(); parsed.load(values[0])
        require('__Host-tnbp-refresh' in parsed, 'Refresh-Cookie ungültig')
        cookie = parsed['__Host-tnbp-refresh']
        attributes = {part.partition('=')[0].strip().lower() for part in values[0].split(';')[1:]}
        require(bool(cookie['secure']) and bool(cookie['httponly']) and cookie['samesite'].lower() == 'strict'
            and cookie['path'] == '/' and 'domain' not in attributes, 'Refresh-Cookieattribute verletzen den Vertrag')
        require((cookie.value == '' and cookie['max-age'] == '0') if deleted else bool(cookie.value), 'Cookie-Lösch-/Ausgabewert ungültig')
        if not deleted:
            seconds = int(cookie['max-age'])
            require(lifetime[0] <= seconds <= lifetime[1], 'Refresh-Cookiefrist verletzt den Vertrag')
            if cookie['expires']:
                expires = parsedate_to_datetime(cookie['expires']).timestamp()
                require(abs(expires - time.time() - seconds) <= 5, 'Refresh-Cookieablauf stimmt nicht')
        return values[0].split(';')[0]
    def access_lifetime(session):
        parts = session['accessToken'].split('.')
        require(len(parts) == 3, 'Access-JWT fehlt')
        claims = json.loads(base64.urlsafe_b64decode(parts[1] + '=' * (-len(parts[1]) % 4)))
        expiry = datetime.fromisoformat(session['expiresAt'].replace('Z', '+00:00')).timestamp()
        require(claims['exp'] - claims['iat'] == 600 and claims['nbf'] == claims['iat']
            and expiry == claims['exp'] and 590 <= expiry - time.time() <= 600,
            'Access-/Antwortfrist verletzt den Zehn-Minuten-Vertrag')
        return claims

    def expired_access(session):
        claims = access_lifetime(session)
        claims.update(iat=int(time.time()) - 601, nbf=int(time.time()) - 601, exp=int(time.time()) - 1)
        encode = lambda value: base64.urlsafe_b64encode(json.dumps(value, separators=(',', ':')).encode()).rstrip(b'=').decode()
        unsigned = encode({'alg': 'HS256', 'typ': 'JWT'}) + '.' + encode(claims)
        signature = base64.urlsafe_b64encode(hmac.digest(bytes(32), unsigned.encode(), 'sha256')).rstrip(b'=').decode()
        call('GET', '/access/me', headers={'Authorization': 'Bearer ' + unsigned + '.' + signature}, expected=401)

    def age_family(refresh, created, last_used):
        # Ausschließlich die zwei eindeutigen synthetischen Konten dieser Prüfung.
        token_hash = hashlib.sha256(refresh.partition('=')[2].encode()).hexdigest()
        require(bool(guard.sql("UPDATE access.session_families SET created_at=clock_timestamp()-interval '" + str(created)
            + " seconds',last_used_at=clock_timestamp()-interval '" + str(last_used)
            + " seconds' WHERE id=(SELECT family_id FROM access.refresh_tokens WHERE token_hash='" + token_hash + "') RETURNING id")),
            'Synthetische Prüffamilie fehlt')

    def rejected_signature(body, headers):
        return body, {name: headers.get_all(name, []) for name in ('Cache-Control', 'Content-Type', 'WWW-Authenticate', 'Set-Cookie')}

    try:
        process, record = guard.launch(target, 'compatible', url + '/api/v2/access/csrf')
        accounts = []
        # Jede synthetische Kennung steht schon vor der Registrierung für Cleanup fest.
        for email in emails:
            csrf, headers = call('GET', '/access/csrf')
            cookie = headers['Set-Cookie'].split(';')[0]
            call('POST', '/access/registrations', {'registrationToken': token, 'email': email, 'password': password}, expected=201)
            session_headers = {'Cookie': cookie, 'Origin': origin, 'X-CSRF-TOKEN': csrf['token']}
            credentials = {'email': email, 'password': password}
            session, headers = call('POST', '/access/login', credentials, session_headers)
            user = str(uuid.UUID(session['userId']))
            expired_access(session)
            first_refresh = refresh_cookie(headers)
            session_headers['Cookie'] = cookie + '; ' + first_refresh
            # Fehlende/falsche CSRF und Origin dürfen keine Cookie-Mutation bestätigen.
            for action in ('login', 'refresh', 'logout'):
                for removed, value in (('Origin', None), ('Origin', 'https://fremd.example'),
                                       ('Origin', origin + '/'), ('X-CSRF-TOKEN', None), ('X-CSRF-TOKEN', 'falsch')):
                    rejected_headers = {**session_headers}
                    if value is None: rejected_headers.pop(removed)
                    else: rejected_headers[removed] = value
                    call('POST', '/access/' + action, credentials if action == 'login' else None, rejected_headers, expected=403)
            wrong, wrong_headers = call('POST', '/access/login', {'email': email, 'password': password + ' falsch'}, session_headers, expected=401)
            unknown, unknown_headers = call('POST', '/access/login', {'email': 'unknown-' + str(uuid.uuid4()) + '@example.org', 'password': password + ' falsch'}, session_headers, expected=401)
            require(rejected_signature(wrong, wrong_headers) == rejected_signature(unknown, unknown_headers), 'Anmeldeablehnung verrät unbekannte Konten')
            call('POST', '/access/refresh', headers={**session_headers, 'Cookie': cookie}, expected=401)
            refreshed, headers = call('POST', '/access/refresh', headers=session_headers)
            require(refreshed['userId'] == user, 'Refresh wechselte das Konto')
            access_lifetime(refreshed)
            rotated = refresh_cookie(headers)
            require(rotated != first_refresh, 'Refresh-Cookie wurde nicht rotiert')
            continued, continued_headers = call('POST', '/access/refresh', headers={**session_headers, 'Cookie': cookie + '; ' + rotated})
            access_lifetime(continued)
            latest = refresh_cookie(continued_headers)
            require(latest != rotated, 'Erneuerte Refresh-Cookies sind nicht erneut rotierbar')
            call('POST', '/access/refresh', headers=session_headers, expected=401)
            call('POST', '/access/refresh', headers={**session_headers, 'Cookie': cookie + '; ' + latest}, expected=401)
            # Frist- und Logoutproben verwenden jeweils eine neue gültige Familie.
            for created, last_used, allowed, seconds in (
                    (40 * 86400, 30 * 86400 - 60, True, (2592000, 2592000)),
                    (40 * 86400, 30 * 86400 + 1, False, None),
                    (90 * 86400 - 120, 86400, True, (110, 120)),
                    (90 * 86400 + 1, 86400, False, None)):
                probe, probe_headers = call('POST', '/access/login', credentials, {**session_headers, 'Cookie': cookie})
                access_lifetime(probe)
                probe_refresh = refresh_cookie(probe_headers)
                age_family(probe_refresh, created, last_used)
                checked, checked_headers = call('POST', '/access/refresh', headers={**session_headers, 'Cookie': cookie + '; ' + probe_refresh}, expected=200 if allowed else 401)
                if allowed:
                    access_lifetime(checked)
                    require(refresh_cookie(checked_headers, lifetime=seconds) != probe_refresh, 'Fristprobe rotiert nicht')
                else:
                    refresh_cookie(checked_headers, deleted=True)
            refreshed, fresh_headers = call('POST', '/access/login', credentials, {**session_headers, 'Cookie': cookie})
            access_lifetime(refreshed)
            session_headers['Cookie'] = cookie + '; ' + refresh_cookie(fresh_headers)
            bearer = {'Authorization': 'Bearer ' + refreshed['accessToken']}
            require(call('GET', '/access/me', headers=bearer)[0]['userId'] == user, 'Kontozugang stimmt nicht')
            accounts.append({'user': user, 'bearer': bearer, 'cookies': session_headers})
        # Alle geschützten Operationstypen müssen ohne gültigen Bearer scheitern.
        for bad in ({}, {'Authorization': 'Bearer ungueltig'}):
            for method, path, body in (
                ('GET', '/access/me', None), ('GET', '/expense-budget/budget', None),
                ('GET', '/expense-budget/month-summary', None), ('GET', '/expense-budget/expenses', None),
                ('POST', '/expense-budget/expenses', {'name': 'Nicht speichern', 'amountCents': 1}),
                ('PUT', '/expense-budget/budget', {'amountCents': 1}),
                ('PUT', '/expense-budget/expenses/' + str(uuid.uuid4()), {'name': 'Nein', 'amountCents': 1}),
                ('DELETE', '/expense-budget/expenses/' + str(uuid.uuid4()), None),
                ('GET', '/savings-goals', None), ('POST', '/savings-goals', {'name': 'Nein', 'targetAmountCents': 1}),
                ('PUT', '/savings-goals/' + str(uuid.uuid4()), {'name': 'Nein', 'targetAmountCents': 1}),
                ('PUT', '/savings-goals/' + str(uuid.uuid4()) + '/progress', {'progressCents': 1}),
                ('DELETE', '/savings-goals/' + str(uuid.uuid4()), None)):
                call(method, path, body, bad, expected=401)
        # Verschiedene Werte machen eine fehlende Kontotrennung sichtbar.
        for index, account in enumerate(accounts):
            bearer = account['bearer']
            require(call('GET', '/expense-budget/expenses', headers=bearer)[0] == [], 'Fremde Ausgaben sichtbar')
            require(call('GET', '/savings-goals', headers=bearer)[0] == [], 'Fremde Sparziele sichtbar')
            require(call('GET', '/expense-budget/budget', headers=bearer)[0]['amountCents'] is None, 'Fremdes Budget sichtbar')
            account['budget'] = 12345 + index
            call('PUT', '/expense-budget/budget', {'amountCents': account['budget']}, bearer)
            expense, _ = call('POST', '/expense-budget/expenses', {'name': 'Prüfausgabe ' + str(index), 'amountCents': 123 + index}, bearer, expected=201)
            account['expense'] = expense
            goal, _ = call('POST', '/savings-goals', {'name': 'Prüfziel ' + str(index), 'targetAmountCents': 10000 + index}, bearer, expected=201)
            account['goal'] = goal
        for index, account in enumerate(accounts):
            bearer, other = account['bearer'], accounts[1-index]
            require(call('GET', '/expense-budget/expenses', headers=bearer)[0] == [account['expense']], 'Ausgaben-Kontotrennung fehlgeschlagen')
            require(call('GET', '/savings-goals', headers=bearer)[0] == [account['goal']], 'Ziel-Kontotrennung fehlgeschlagen')
            require(call('GET', '/expense-budget/budget', headers=bearer)[0]['amountCents'] == account['budget'], 'Budgetprüfung fehlgeschlagen')
            summary = call('GET', '/expense-budget/month-summary', headers=bearer)[0]
            require(summary['budgetCents'] == account['budget'] and summary['expensesCents'] == 123 + index
                    and summary['remainingCents'] == account['budget'] - 123 - index, 'Monats-Kontotrennung fehlgeschlagen')
            for method, collection, suffix, body in (
                ('PUT', '/expense-budget/expenses/', '', {'name': 'Fremd', 'amountCents': 999}),
                ('DELETE', '/expense-budget/expenses/', '', None),
                ('PUT', '/savings-goals/', '', {'name': 'Fremd', 'targetAmountCents': 999}),
                ('PUT', '/savings-goals/', '/progress', {'progressCents': 999}),
                ('DELETE', '/savings-goals/', '', None)):
                foreign = other['expense'] if 'expenses' in collection else other['goal']
                hidden = call(method, collection + foreign['id'] + suffix, body, bearer, expected=404)[0]
                missing = call(method, collection + str(uuid.uuid4()) + suffix, body, bearer, expected=404)[0]
                require(hidden == missing, 'Fremde Ressourcenexistenz offengelegt')
            expense = account['expense']
            call('PUT', '/expense-budget/expenses/' + expense['id'], {'name': 'Prüfung geändert', 'amountCents': 124 + index}, bearer)
            edited = call('GET', '/expense-budget/expenses', headers=bearer)[0]
            require(len(edited) == 1 and edited[0] == {**expense, 'name': 'Prüfung geändert', 'amountCents': 124 + index}, 'Ausgabenänderung nicht gespeichert')
            goal = account['goal']
            call('PUT', '/savings-goals/' + goal['id'], {'name': 'Geprüft', 'targetAmountCents': 20000 + index, 'targetDate': '2030-12-31'}, bearer)
            call('PUT', '/savings-goals/' + goal['id'] + '/progress', {'progressCents': 22222 + index}, bearer)
            call('PUT', '/savings-goals/' + goal['id'] + '/progress', {'progressCents': -1}, bearer, expected=400)
            account['expected_expenses'] = edited
            goals = call('GET', '/savings-goals', headers=bearer)[0]
            account['expected_goals'] = goals
            require(goals == [{**goal, 'name': 'Geprüft', 'targetAmountCents': 20000 + index, 'targetDate': '2030-12-31', 'progressCents': 22222 + index}], 'Zieländerung nicht gespeichert')
        # Erst nach beiden Fremdversuchen entfernen, damit beide Perspektiven echte Fremdressourcen prüfen.
        for account in accounts:
            bearer = account['bearer']
            require(call('GET', '/expense-budget/expenses', headers=bearer)[0] == account['expected_expenses'], 'Fremdänderung an Ausgaben')
            require(call('GET', '/savings-goals', headers=bearer)[0] == account['expected_goals'], 'Fremdänderung an Zielen')
            call('DELETE', '/expense-budget/expenses/' + account['expense']['id'], headers=bearer, expected=204)
            require(call('GET', '/expense-budget/expenses', headers=bearer)[0] == [], 'Ausgabenlöschung nicht gespeichert')
            call('DELETE', '/savings-goals/' + account['goal']['id'], headers=bearer, expected=204)
            require(call('GET', '/savings-goals', headers=bearer)[0] == [], 'Ziellöschung nicht gespeichert')
            _, deleted = call('POST', '/access/logout', headers=account['cookies'], expected=204)
            refresh_cookie(deleted, deleted=True)
            call('POST', '/access/refresh', headers=account['cookies'], expected=401)
        print('Alt-JAR: zwei Konten, Authentifizierung, CSRF/Origin, Sitzungen, gespeicherte v1-Mutationen, Kontotrennung und no-store erfolgreich.')
    finally:
        try:
            if process is not None:
                guard.stop()
                process.wait()
        finally:
            try:
                for email in emails:
                    email_sql = "'" + email.replace("'", "''") + "'"
                    guard.sql("DO $$ DECLARE target uuid; BEGIN SELECT id INTO target FROM access.accounts WHERE email=" + email_sql + ";"
                        "DELETE FROM access.refresh_tokens WHERE family_id IN (SELECT id FROM access.session_families WHERE user_id=target);"
                        "DELETE FROM access.session_families WHERE user_id=target;DELETE FROM budget.budgets WHERE user_id=target;"
                        "DELETE FROM expenses.expenses WHERE user_id=target;DELETE FROM savings_goals.goals WHERE user_id=target;"
                        "DELETE FROM access.accounts WHERE id=target; END $$;")
            finally:
                os.environ.clear(); os.environ.update(previous)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', required=True)
    parser.add_argument('--tool-release', default=str(ROOT / 'backend/target/tnbp-0.1.0-SNAPSHOT.jar'))
    parser.add_argument('--state-dir', default=str(ROOT / '.local/api-release'))
    parser.add_argument('--port', type=int, required=True)
    args = parser.parse_args()
    args.check_port = args.port
    args.timeout = 60
    module_spec = importlib.util.spec_from_file_location('release_guard', ROOT / 'scripts/api-release.py')
    module = importlib.util.module_from_spec(module_spec); module_spec.loader.exec_module(module)
    guard = module.Guard(args)
    with guard.lock(): guard.certify()

if __name__ == '__main__': main()
