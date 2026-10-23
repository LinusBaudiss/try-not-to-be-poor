package de.linus.tnbp.access;

import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;

@Configuration
@EnableConfigurationProperties({RegistrationLink.class, SessionSettings.class})
class AccessConfiguration {
    @Bean
    JsonMapperBuilderCustomizer strictJsonStrings() {
        return builder -> builder.withCoercionConfig(String.class, coercion -> coercion
            .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
            .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
            .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail))
            .withCoercionConfig(Long.class, coercion -> coercion
                .setCoercion(CoercionInputShape.String, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.EmptyString, CoercionAction.Fail));
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 19456, 2);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SessionSettings settings, SessionJwt jwt) throws Exception {
        var csrfRepository = new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository();
        csrfRepository.setHeaderName("X-CSRF-TOKEN");
        var origin = new org.springframework.web.filter.OncePerRequestFilter() {
            @Override protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                    jakarta.servlet.http.HttpServletResponse response, jakarta.servlet.FilterChain chain)
                    throws java.io.IOException, jakarta.servlet.ServletException {
                String path = request.getServletPath();
                if (path.startsWith("/api/v1/expense-budget/") || path.equals("/api/v1/savings-goals")
                    || path.matches("/api/v1/savings-goals/[^/]+/progress")) response.setHeader("Cache-Control", "no-store");
                if (path.startsWith("/api/v1/access/") && !path.equals("/api/v1/access/registrations")) {
                    response.setHeader("Cache-Control", "no-store");
                    if (request.getMethod().equals("POST")) {
                        if (!jwt.available()) {
                            SessionHttp.error(response, 503);
                            return;
                        }
                        if (!settings.origin().equals(request.getHeader("Origin"))) {
                            SessionHttp.error(response, 403);
                            return;
                        }
                    }
                }
                chain.doFilter(request, response);
            }
        };
        // Die HttpSession enthält ausschließlich CSRF-Zustand, keine Anmeldung.
        // Bearer-GETs dürfen fremde CSRF-Handshakes weder durch Session-Fixation noch Tokenlöschung verändern.
        var noSessionAuthentication = new org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy();
        return http
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .sessionAuthenticationStrategy(noSessionAuthentication))
            .csrf(csrf -> csrf.csrfTokenRepository(csrfRepository)
                .sessionAuthenticationStrategy(noSessionAuthentication)
                .ignoringRequestMatchers("/api/v1/access/registrations")
                // Diese Routen akzeptieren ausschließlich Bearer; Refresh-/CSRF-Cookies erteilen keinen Zugang.
                .ignoringRequestMatchers(request -> (request.getMethod().equals("PUT")
                    && (request.getServletPath().equals("/api/v1/expense-budget/budget")
                        || request.getServletPath().matches("/api/v1/savings-goals/[^/]+/progress")))
                    || (request.getMethod().equals("POST")
                    && (request.getServletPath().equals("/api/v1/expense-budget/expenses")
                        || request.getServletPath().equals("/api/v1/savings-goals")))
                    || ((request.getMethod().equals("PUT") || request.getMethod().equals("DELETE"))
                    && request.getServletPath().matches("/api/v1/expense-budget/expenses/[^/]+"))))
            .addFilterBefore(origin, org.springframework.security.web.csrf.CsrfFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/v1/access/registrations", "/api/v1/access/login",
                    "/api/v1/access/refresh", "/api/v1/access/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/access/csrf").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/access/me", "/api/v1/expense-budget/budget", "/api/v1/expense-budget/expenses", "/api/v1/expense-budget/month-summary", "/api/v1/savings-goals").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/expense-budget/budget", "/api/v1/savings-goals/*/progress").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/expense-budget/expenses", "/api/v1/savings-goals").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/expense-budget/expenses/*").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/v1/expense-budget/expenses/*").authenticated()
                .anyRequest().denyAll())
            .oauth2ResourceServer(oauth -> oauth.jwt(config -> config.decoder(jwt))
                .authenticationEntryPoint((request, response, failure) -> SessionHttp.error(response, 401)))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, failure) -> SessionHttp.error(response,
                    request.getServletPath().equals("/api/v1/access/me")
                        || request.getServletPath().equals("/api/v1/expense-budget/budget")
                        || request.getServletPath().equals("/api/v1/expense-budget/expenses")
                        || request.getServletPath().matches("/api/v1/expense-budget/expenses/[^/]+")
                        || request.getServletPath().equals("/api/v1/expense-budget/month-summary")
                        || request.getServletPath().equals("/api/v1/savings-goals")
                        || request.getServletPath().matches("/api/v1/savings-goals/[^/]+/progress") ? 401 : 403))
                .accessDeniedHandler((request, response, failure) -> SessionHttp.error(response, 403)))
            .requestCache(cache -> cache.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .build();
    }
}
