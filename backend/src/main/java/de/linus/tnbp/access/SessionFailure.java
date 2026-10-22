package de.linus.tnbp.access;

class SessionFailure extends RuntimeException {
    final int status;
    SessionFailure(int status) { super("Sitzungsanfrage fehlgeschlagen."); this.status = status; }
}
