package de.linus.tnbp.access;

import de.linus.tnbp.TnbpApplication;
import de.linus.tnbp.finance.MonthlyAutomationReadiness;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Nur im Testklassenpfad: Gesamtbereitschaft und Uhr steuerbar, Versionsbarriere bleibt real. */
public final class MonthlyAutomationE2eServer {
    static final TestClock CLOCK = new TestClock();
    static final TestReadiness READY = new TestReadiness();
    static class TestClock extends Clock {
        volatile Instant now = Instant.parse("2026-10-31T22:59:59Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now,zone); }
        @Override public Instant instant() { return now; }
    }
    static class TestReadiness extends MonthlyAutomationReadiness {
        volatile boolean open = true;
        @Override public boolean available() { return open; }
    }
    @TestConfiguration static class Controls {
        @Bean @Primary Clock automationClock() { return CLOCK; }
        @Bean @Primary MonthlyAutomationReadiness automationReadiness() { return READY; }
        @Bean org.springframework.web.filter.OncePerRequestFilter calendarDate() {
            return new org.springframework.web.filter.OncePerRequestFilter() {
                @Override protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                        jakarta.servlet.http.HttpServletResponse response,jakarta.servlet.FilterChain chain)
                        throws java.io.IOException,jakarta.servlet.ServletException {
                    response.setHeader("Date",java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME.format(CLOCK.now.atZone(ZoneOffset.UTC)));
                    chain.doFilter(request,response);
                }
            };
        }
    }
    /** Auch abgekoppelte Supervisor-Sitzungen gehören zur lokalen Testfixture. */
    static final class LocalResources implements AutoCloseable {
        Path root, folder;
        Map<String,String> environment;
        List<String> stopCommand;
        final List<Process> processes = new ArrayList<>();
        final Map<Long,ProcessHandle> handles = new LinkedHashMap<>();
        org.springframework.context.ConfigurableApplicationContext application;
        com.sun.net.httpserver.HttpServer controls;
        io.zonky.test.db.postgres.embedded.EmbeddedPostgres postgres;
        boolean closed;
        synchronized Process start(ProcessBuilder builder) throws java.io.IOException {
            if(closed)throw new IllegalStateException("Die lokale Testfixture wird bereits beendet.");
            return track(builder);
        }
        private Process track(ProcessBuilder builder) throws java.io.IOException {
            var process=builder.start(); processes.add(process); capture(); return process;
        }
        synchronized void capture() {
            var owned=new ArrayList<ProcessHandle>();
            for(var process:processes)owned.add(process.toHandle());
            if(folder!=null)ProcessHandle.allProcesses().filter(handle->handle.info().arguments()
                .map(arguments->Arrays.asList(arguments).contains(folder.toString())).orElse(false)).forEach(owned::add);
            for(var handle:owned) {handles.put(handle.pid(),handle);handle.descendants().forEach(child->handles.put(child.pid(),child));}
        }
        @Override public synchronized void close() {
            if(closed)return;closed=true;
            boolean interrupted=Thread.interrupted();
            try {
                try {if(controls!=null)controls.stop(0);}catch(RuntimeException ignored){ /* Kindprozesse trotzdem bereinigen. */ }
                try {if(application!=null)application.close();}catch(RuntimeException ignored){ /* Kindprozesse trotzdem bereinigen. */ }
                capture();
                if(stopCommand!=null&&handles.values().stream().anyMatch(ProcessHandle::isAlive)) {
                    try {
                        var stop=new ProcessBuilder(stopCommand).directory(root.toFile()).inheritIO();stop.environment().putAll(environment);
                        track(stop).waitFor(3,TimeUnit.SECONDS);
                    } catch(java.io.IOException ignored) { /* Danach sämtliche eigenen Prozesse begrenzt beenden. */ }
                    catch(InterruptedException ignored) {interrupted=true;}
                }
                capture();
                var children=new ArrayList<>(handles.values());children.sort(Comparator.comparingLong(ProcessHandle::pid).reversed());
                children.stream().filter(ProcessHandle::isAlive).forEach(ProcessHandle::destroy);
                interrupted|=await(children,2);
                capture();
                children=new ArrayList<>(handles.values());
                children.stream().filter(ProcessHandle::isAlive).forEach(ProcessHandle::destroyForcibly);
                interrupted|=await(children,2);
                for(var process:processes)try {process.waitFor(1,TimeUnit.SECONDS);}catch(InterruptedException ignored){interrupted=true;}
                if(children.stream().anyMatch(ProcessHandle::isAlive))throw new IllegalStateException("Ein lokaler Testprozess wurde nicht beendet.");
            } finally {
                if(postgres!=null)try{postgres.close();}catch(java.io.IOException ignored){ /* Prozessbereinigung wurde bereits ausgeführt. */ }
                if(interrupted)Thread.currentThread().interrupt();
            }
        }
        private boolean await(List<ProcessHandle> children,int seconds) {
            boolean interrupted=false;long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(seconds);
            for(var child:children)if(child.isAlive())try {
                child.onExit().get(Math.max(1,deadline-System.nanoTime()),TimeUnit.NANOSECONDS);
            } catch(InterruptedException ignored){interrupted=true;}catch(java.util.concurrent.ExecutionException|java.util.concurrent.TimeoutException ignored){ /* Anschließende harte Beendigung. */ }
            return interrupted;
        }
    }
    public static void main(String[] args) throws Exception {
        var resources=new LocalResources();
        Runtime.getRuntime().addShutdownHook(new Thread(resources::close));
        try {
        Path root=Path.of(System.getProperty("user.dir")).toAbsolutePath();
        if(root.getFileName().toString().equals("backend"))root=root.getParent();
        Path folder=Files.createTempDirectory("tnbp-automation-barrier-");
        resources.root=root;resources.folder=folder;resources.postgres=PostgresFixture.POSTGRES;
        var environment=new LinkedHashMap<String,String>();
        resources.environment=environment;
        environment.put("DB_URL",PostgresFixture.URL);environment.put("DB_ADMIN_USER","postgres");environment.put("DB_ADMIN_PASSWORD","postgres");
        environment.put("DB_RUNTIME_USER","tnbp_runtime");environment.put("DB_RUNTIME_PASSWORD","runtime-test-only");
        environment.put("DB_MIGRATION_USER","tnbp_migrator");environment.put("DB_MIGRATION_PASSWORD","migration-test-only");
        environment.put("SERVER_PORT","18082");environment.put("SESSION_SIGNING_KEY",Base64.getEncoder().encodeToString(new byte[32]));
        environment.put("SESSION_ISSUER","automation-test");environment.put("SESSION_AUDIENCE","automation-spa");
        environment.put("SESSION_ORIGIN","https://localhost:4200");
        List<String> command=List.of("python3",root.resolve("scripts/api-release.py").toString(),"start","--release",
            root.resolve("backend/target/tnbp-0.1.0-SNAPSHOT.jar").toString(),"--state-dir",folder.toString(),
            "--ready-url","http://127.0.0.1:18082/api/v2/access/csrf");
        resources.stopCommand=new ArrayList<>(command);resources.stopCommand.set(2,"stop");
        var builder=new ProcessBuilder(command).directory(root.toFile()).inheritIO();builder.environment().putAll(environment);
        var compatible=resources.start(builder);
        try {
            var client=java.net.http.HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build(); boolean started=false;
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(60);
            while(compatible.isAlive()&&!started&&System.nanoTime()<deadline) {
                try {started=client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://127.0.0.1:18082/api/v1/access/csrf")).timeout(Duration.ofSeconds(1)).GET().build(),java.net.http.HttpResponse.BodyHandlers.discarding()).statusCode()==200;}
                catch(java.io.IOException ignored) { /* Noch kein Listener. */ }
                if(!started)Thread.sleep(50);
            }
            if(!started)throw new IllegalStateException("Kompatibler Prüfrelease startet nicht.");
            var retire=new ArrayList<>(command);retire.set(2,"retire");
            var stop=new ProcessBuilder(retire).directory(root.toFile()).inheritIO();stop.environment().putAll(environment);
            var transition=resources.start(stop);
            if(!transition.waitFor(90,TimeUnit.SECONDS)||transition.exitValue()!=0)throw new IllegalStateException("Echte v1-Stilllegung fehlgeschlagen.");
            if(!compatible.waitFor(20,TimeUnit.SECONDS))throw new IllegalStateException("Alter API-Prozess ist nicht beendet.");
        } finally {resources.capture();}
        var proof=PostgresFixture.ADMIN.queryForMap("SELECT * FROM api_version.state");
        List<String> settings=new ArrayList<>();PostgresFixture.configure((key,value)->settings.add("--"+key+"="+value));
        settings.addAll(List.of("--server.address=127.0.0.1","--server.port=8080","--api.version.mode=retired",
            "--api.version.release-sha256="+proof.get("release_sha256"),"--api.version.instance-id="+UUID.randomUUID(),
            "--access.session.signing-key="+Base64.getEncoder().encodeToString(new byte[32]),"--access.session.issuer=automation-test",
            "--access.session.audience=automation-spa","--access.session.origin=https://localhost:4200",
            "--registration.link.enabled=true","--registration.link.sha256="+RegistrationTest.sha256(RegistrationTest.TOKEN),
            "--registration.link.issued-at="+CLOCK.now));
        var application=new SpringApplication(TnbpApplication.class,Controls.class).run(settings.toArray(String[]::new));
        resources.application=application;
        var controls=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",8081),0);
        resources.controls=controls;
        controls.createContext("/clock",exchange->{
            if(exchange.getRequestMethod().equals("POST"))CLOCK.now=Instant.parse(new String(exchange.getRequestBody().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));
            byte[] body=CLOCK.now.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });
        controls.createContext("/readiness",exchange->{READY.open=Boolean.parseBoolean(new String(exchange.getRequestBody().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));exchange.sendResponseHeaders(204,-1);exchange.close();});
        controls.start();
        } catch(Exception|Error failure) {try{resources.close();}catch(Exception cleanup){failure.addSuppressed(cleanup);}throw failure;}
    }
}
