package de.linus.tnbp.access;

import de.linus.tnbp.contract.v2.api.SessionsApi;
import de.linus.tnbp.contract.v2.model.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class SessionV2Controller implements SessionsApi {
    private final SessionService sessions;
    private final HttpServletRequest request;
    public SessionV2Controller(SessionService sessions, HttpServletRequest request) { this.sessions = sessions; this.request = request; }

    @Override public ResponseEntity<CsrfResponse> sessionCsrf() {
        var csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        return ResponseEntity.ok(new CsrfResponse(csrf.getToken()));
    }
    @Override public ResponseEntity<SessionResponse> login(String origin, String csrf, LoginRequest input) {
        return response(sessions.login(input.getEmail(), input.getPassword(), refreshCookie()));
    }
    @Override public ResponseEntity<SessionResponse> refreshSession(String origin, String csrf) {
        return response(sessions.refresh(refreshCookie()));
    }
    @Override public ResponseEntity<Void> logoutSession(String origin, String csrf) {
        sessions.logout(refreshCookie());
        return ResponseEntity.noContent().header("Set-Cookie", SessionHttp.cookie("", 0)).build();
    }
    @Override public ResponseEntity<SessionIdentity> sessionIdentity() {
        return ResponseEntity.ok(new SessionIdentity(UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName())));
    }
    private String refreshCookie() {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies()).filter(cookie -> cookie.getName().equals(SessionHttp.COOKIE))
            .map(jakarta.servlet.http.Cookie::getValue).findFirst().orElse(null);
    }
    private ResponseEntity<SessionResponse> response(SessionService.Issued issued) {
        return ResponseEntity.ok().header("Set-Cookie", SessionHttp.cookie(issued.refreshToken(), issued.cookieSeconds()))
            .body(new SessionResponse(issued.accessToken(), issued.expiresAt().atOffset(ZoneOffset.UTC), issued.userId()));
    }
}
