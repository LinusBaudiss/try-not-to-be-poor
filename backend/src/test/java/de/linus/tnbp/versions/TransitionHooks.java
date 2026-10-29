package de.linus.tnbp.versions;

import de.linus.tnbp.shared.FinanceTransactions;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.HandlerInterceptor;

/** Nur in eine synthetische Test-JAR eingefügt. Keine Haltepunkte im Produktivcode. */
public class TransitionHooks {
    private static String firstBearer;
    @Bean org.springframework.boot.web.servlet.FilterRegistrationBean<jakarta.servlet.Filter> faultySecurityForCertification() {
        var registration = new org.springframework.boot.web.servlet.FilterRegistrationBean<jakarta.servlet.Filter>();
        registration.setOrder(Integer.MIN_VALUE);
        registration.setFilter((request, response, chain) -> {
            var http = (jakarta.servlet.http.HttpServletRequest)request;
            var result = (jakarta.servlet.http.HttpServletResponse)response;
            String failure = System.getenv("API_TEST_CERT_FAILURE");
            if ("negative-progress".equals(failure) && http.getRequestURI().matches("/api/v1/savings-goals/[^/]+/progress") && http.getMethod().equals("PUT")) {
                var body = new String(http.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                if (body.contains("-1")) { result.setContentType("application/json");result.getWriter().write("{}");return; }
                // Positive Versuche durchlaufen weiterhin den wirklichen Sicherheits-/Fachpfad.
                var wrapped = new jakarta.servlet.http.HttpServletRequestWrapper(http) {
                    @Override public jakarta.servlet.ServletInputStream getInputStream() {
                        var bytes = new java.io.ByteArrayInputStream(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        return new jakarta.servlet.ServletInputStream() {
                            @Override public int read() { return bytes.read(); }
                            @Override public boolean isFinished() { return bytes.available()==0; }
                            @Override public boolean isReady() { return true; }
                            @Override public void setReadListener(jakarta.servlet.ReadListener listener) { }
                        };
                    }
                };
                chain.doFilter(wrapped,response); return;
            }
            if ("neutral-login".equals(failure) && http.getRequestURI().equals("/api/v1/access/login")) {
                byte[] body=http.getInputStream().readAllBytes();
                if(new String(body,java.nio.charset.StandardCharsets.UTF_8).contains("unknown-")) {
                    result.setStatus(401);result.setHeader("Cache-Control","no-store");result.setContentType("application/json");
                    result.getWriter().write("{\"code\":\"UNKNOWN_ACCOUNT\",\"message\":\"Unbekannt\"}");return;
                }
                chain.doFilter(withBody(http,body),response);return;
            }
            if ("expired-access".equals(failure) && http.getRequestURI().equals("/api/v1/access/me") && http.getHeader("Authorization")!=null) {
                try {
                    var claims=com.nimbusds.jwt.SignedJWT.parse(http.getHeader("Authorization").substring(7)).getJWTClaimsSet();
                    if(claims.getExpirationTime().toInstant().isBefore(java.time.Instant.now())) {
                        result.setHeader("Cache-Control","no-store");result.setContentType("application/json");result.getWriter().write("{}");return;
                    }
                } catch(java.text.ParseException ignored) { }
            }
            boolean auth = "auth".equals(failure) && http.getRequestURI().equals("/api/v1/access/me") && http.getHeader("Authorization") == null;
            boolean csrf = "csrf".equals(failure) && http.getRequestURI().equals("/api/v1/access/login") && http.getHeader("X-CSRF-TOKEN") == null;
            boolean origin = "origin".equals(failure) && http.getRequestURI().equals("/api/v1/access/login") && http.getHeader("Origin") == null;
            if(auth || csrf || origin) {
                result.setHeader("Cache-Control","no-store");result.setContentType("application/json");result.getWriter().write("{}");
            } else if (failure != null && failure.startsWith("cookie-")) {
                chain.doFilter(request, new jakarta.servlet.http.HttpServletResponseWrapper(result) {
                    private String damage(String name, String value) {
                        if (!name.equalsIgnoreCase("Set-Cookie") || !value.startsWith("__Host-tnbp-refresh=")) return value;
                        if (failure.equals("cookie-rotation") && !http.getRequestURI().endsWith("/refresh")) return value;
                        if (failure.equals("cookie-deletion") && !http.getRequestURI().endsWith("/logout")) return value;
                        return switch(failure) {
                            case "cookie-secure", "cookie-rotation", "cookie-deletion" -> value.replace("; Secure", "");
                            case "cookie-http" -> value.replace("; HttpOnly", "");
                            case "cookie-samesite" -> value.replace("SameSite=Strict", "SameSite=Lax");
                            case "cookie-path" -> value.replace("Path=/", "Path=/api");
                            case "cookie-no-rotation" -> {
                                String old="";
                                if(http.getCookies()!=null) for(var cookie:http.getCookies()) if(cookie.getName().equals("__Host-tnbp-refresh")) old=cookie.getValue();
                                yield http.getRequestURI().endsWith("/refresh") && getStatus()==200
                                    ? "__Host-tnbp-refresh="+old+value.substring(value.indexOf(';')) : value;
                            }
                            case "cookie-refresh-lifetime" -> value.replace("Max-Age=2592000","Max-Age=2678400");
                            case "cookie-domain-empty" -> value + "; Domain=";
                            default -> value + "; Domain=localhost";
                        };
                    }
                    @Override public void addHeader(String name, String value) { super.addHeader(name, damage(name,value)); }
                    @Override public void setHeader(String name, String value) { super.setHeader(name, damage(name,value)); }
                });
            } else chain.doFilter(request,response);
        });
        return registration;
    }
    @Bean WebMvcConfigurer transitionHolds(JdbcTemplate jdbc, FinanceTransactions transactions) {
        return new WebMvcConfigurer() {
            @Override public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(new HandlerInterceptor() {
                    @Override public boolean preHandle(jakarta.servlet.http.HttpServletRequest request,
                            jakarta.servlet.http.HttpServletResponse response, Object handler) throws Exception {
                        return hold(request, response, jdbc, transactions);
                    }
                });
            }
        };
    }
    private static boolean hold(jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response, JdbcTemplate jdbc, FinanceTransactions transactions) throws Exception {
        String failure = System.getenv("API_TEST_CERT_FAILURE");
        if ("access-lifetime".equals(failure) && request.getRequestURI().equals("/api/v1/access/login")) {
            var input=tools.jackson.databind.json.JsonMapper.builder().build().readValue(request.getInputStream(),java.util.Map.class);
            UUID user=jdbc.queryForObject("SELECT id FROM access.accounts WHERE email=?",UUID.class,input.get("email"));
            var now=java.time.Instant.now();var expiry=now.plusSeconds(1200);
            var claims=new com.nimbusds.jwt.JWTClaimsSet.Builder().issuer("rollback-check").audience("rollback-check-spa").subject(user.toString())
                .issueTime(java.util.Date.from(now)).notBeforeTime(java.util.Date.from(now)).expirationTime(java.util.Date.from(expiry)).build();
            var jwt=new com.nimbusds.jwt.SignedJWT(new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256),claims);
            jwt.sign(new com.nimbusds.jose.crypto.MACSigner(new byte[32]));
            response.setContentType("application/json");response.getWriter().write(tools.jackson.databind.json.JsonMapper.builder().build()
                .writeValueAsString(java.util.Map.of("accessToken",jwt.serialize(),"expiresAt",expiry.toString(),"userId",user.toString())));return false;
        }
        if(java.util.Set.of("replay","replay-family","inactivity-limit","absolute-limit").contains(failure==null?"":failure)
                && request.getRequestURI().equals("/api/v1/access/refresh") && request.getCookies()!=null) {
            for(var cookie:request.getCookies()) if(cookie.getName().equals("__Host-tnbp-refresh")) {
                String hash=java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                    .digest(cookie.getValue().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
                var rows=jdbc.queryForList("SELECT t.consumed,f.revoked,f.last_used_at,f.created_at FROM access.refresh_tokens t JOIN access.session_families f ON f.id=t.family_id WHERE t.token_hash=?",hash);
                if(!rows.isEmpty()) {
                    var row=rows.getFirst();var now=java.time.Instant.now();
                    boolean bad="replay".equals(failure)&&Boolean.TRUE.equals(row.get("consumed"))
                        || "replay-family".equals(failure)&&Boolean.TRUE.equals(row.get("revoked"))
                        || "inactivity-limit".equals(failure)&&((java.sql.Timestamp)row.get("last_used_at")).toInstant().plusSeconds(30L*86400).isBefore(now)
                        || "absolute-limit".equals(failure)&&((java.sql.Timestamp)row.get("created_at")).toInstant().plusSeconds(90L*86400).isBefore(now);
                    if(bad) { response.setContentType("application/json");response.getWriter().write("{}");return false; }
                }
            }
        }
        if ("login".equals(failure) && request.getRequestURI().equals("/api/v1/access/login")) {
            response.setStatus(401); response.getWriter().write("{\"code\":\"SYNTHETIC_LOGIN_FAILURE\"}"); return false;
        }
        if ("budget".equals(failure) && request.getMethod().equals("PUT") && firstBearer==null
                && request.getRequestURI().equals("/api/v1/expense-budget/budget")) firstBearer=request.getHeader("Authorization");
        if ("budget".equals(failure) && request.getMethod().equals("GET") && firstBearer!=null
                && firstBearer.equals(request.getHeader("Authorization")) && request.getRequestURI().equals("/api/v1/expense-budget/budget")) {
            response.setContentType("application/json"); response.getWriter().write("{\"amountCents\":0}"); return false;
        }
        if ("isolation".equals(failure) && request.getRequestURI().equals("/api/v1/expense-budget/budget")) {
            if(request.getMethod().equals("PUT") && firstBearer==null) firstBearer=request.getHeader("Authorization");
            if(request.getMethod().equals("GET") && firstBearer!=null && !firstBearer.equals(request.getHeader("Authorization"))) {
                response.setContentType("application/json");response.getWriter().write("{\"amountCents\":12345}");return false;
            }
        }
        boolean expense=request.getRequestURI().matches("/api/v1/expense-budget/expenses/[^/]+");
        boolean goal=request.getRequestURI().matches("/api/v1/savings-goals/[^/]+");
        if (("expense-edit".equals(failure) && expense || "goal-edit".equals(failure) && goal) && request.getMethod().equals("PUT")) {
            // Fremdversuche bleiben echt; nur eigene Änderungen quittiert das fehlerhafte Binary wirkungslos.
            String owner=request.getHeader("Authorization");
            if(firstBearer==null) firstBearer=owner;
            // PUTs mit dem Namen Fremd sind die vorhergehenden Kontotrennungsprüfungen.
            // Der Body wird nicht verbraucht: Fremd-/fehlende IDs werden erst über den vorhandenen Bestand erkannt.
            String id=request.getRequestURI().substring(request.getRequestURI().lastIndexOf('/')+1);
            UUID user=UUID.fromString(com.nimbusds.jwt.SignedJWT.parse(owner.substring(7)).getJWTClaimsSet().getSubject());
            boolean own=transactions.read(user, context -> jdbc.queryForObject("SELECT EXISTS(SELECT FROM "+(expense?"expenses.expenses":"savings_goals.goals")+" WHERE id=? AND user_id=?)",Boolean.class,UUID.fromString(id),user));
            if(own) { response.setContentType("application/json");response.getWriter().write("{}");return false; }
        }
        if (("expense-delete".equals(failure) && expense || "goal-delete".equals(failure) && goal) && request.getMethod().equals("DELETE")) {
            String owner=request.getHeader("Authorization");
            UUID user=UUID.fromString(com.nimbusds.jwt.SignedJWT.parse(owner.substring(7)).getJWTClaimsSet().getSubject());
            String id=request.getRequestURI().substring(request.getRequestURI().lastIndexOf('/')+1);
            boolean own=transactions.read(user, context -> jdbc.queryForObject("SELECT EXISTS(SELECT FROM "+(expense?"expenses.expenses":"savings_goals.goals")+" WHERE id=? AND user_id=?)",Boolean.class,UUID.fromString(id),user));
            if(own) { response.setStatus(204);return false; }
        }
        String hold = request.getHeader("X-Test-Hold");
        if (hold == null) return true;
        var folder = Path.of(System.getenv("API_TEST_HOLD_DIR"));
        if (hold.equals("orphan")) {
            String script = "import os,time; from pathlib import Path; p=os.fork(); "
                + "exec('if p: os._exit(0)'); os.setsid(); p=os.fork(); exec('if p: os._exit(0)'); "
                + "Path('" + folder.resolve("child.pid") + "').write_text(str(os.getpid())); time.sleep(120)";
            new ProcessBuilder("python3", "-c", script).start().waitFor();
            while (!Files.exists(folder.resolve("child.pid"))) Thread.sleep(10);
            pause(folder, hold); return true;
        }
        if (hold.equals("before-read")) {
            var child = new ProcessBuilder("setsid", "sleep", "120").start();
            Files.writeString(folder.resolve("child.pid"), Long.toString(child.pid()));
            pause(folder, hold);
            return true;
        }
        if (hold.equals("sql")) {
            Files.writeString(folder.resolve("ready"), hold);
            jdbc.execute("SELECT pg_sleep(120)");
            return true;
        }
        var user = UUID.fromString(request.getHeader("X-Test-User"));
        transactions.mutate(user, context -> {
            jdbc.update("INSERT INTO expenses.expenses VALUES (?, ?, 'Prozessnachweis', 123, ?)", UUID.randomUUID(), user, context.day());
            if (hold.equals("before-commit")) pause(folder, hold);
            return null;
        });
        if (hold.equals("after-commit")) pause(folder, hold);
        response.getWriter().write("{\"confirmed\":true}");
        return false;
    }
    private static jakarta.servlet.http.HttpServletRequest withBody(jakarta.servlet.http.HttpServletRequest request,byte[] body) {
        return new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override public jakarta.servlet.ServletInputStream getInputStream() {
                var bytes=new java.io.ByteArrayInputStream(body);
                return new jakarta.servlet.ServletInputStream() {
                    @Override public int read() { return bytes.read(); }
                    @Override public boolean isFinished() { return bytes.available()==0; }
                    @Override public boolean isReady() { return true; }
                    @Override public void setReadListener(jakarta.servlet.ReadListener listener) { }
                };
            }
        };
    }
    private static void pause(Path folder, String hold) {
        try {
            Files.writeString(folder.resolve("ready"), hold);
            while (!Files.exists(folder.resolve("continue"))) Thread.sleep(25);
        } catch (java.io.IOException | InterruptedException failure) { throw new IllegalStateException(failure); }
    }
}
