package de.linus.tnbp.access;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.ResponseCookie;

final class SessionHttp {
    static final String COOKIE = "__Host-tnbp-refresh";
    static String cookie(String value, long seconds) {
        return ResponseCookie.from(COOKIE, value).httpOnly(true).secure(true).sameSite("Strict")
            .path("/").maxAge(seconds).build().toString();
    }
    static void error(HttpServletResponse response, int status) throws IOException {
        response.setStatus(status);
        response.setHeader("Cache-Control", "no-store");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String code = status == 503 ? "SESSION_UNAVAILABLE" : status == 403 ? "SESSION_FORBIDDEN" : "SESSION_REJECTED";
        String message = status == 503 ? "Sitzung konnte nicht bestätigt werden. Melde dich erneut an."
            : status == 403 ? "Sitzungsanfrage nicht erlaubt." : "Anmeldung erforderlich.";
        response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}");
    }
    private SessionHttp() {}
}
