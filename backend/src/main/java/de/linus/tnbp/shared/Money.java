package de.linus.tnbp.shared;

import java.math.BigDecimal;

/** Exakte technische Centgrenze für gespeicherte Werte und Rechenergebnisse. */
public final class Money {
    public static final long MAX_CENTS = 9007199254740991L;

    public static boolean nonnegative(Long value) { return value != null && value >= 0 && value <= MAX_CENTS; }
    public static boolean positive(Long value) { return nonnegative(value) && value > 0; }
    public static long exact(BigDecimal value) { return exact(value.longValueExact()); }
    public static long exact(long value) {
        if (value < -MAX_CENTS || value > MAX_CENTS) throw new ArithmeticException("Ungültige Centgrenze");
        return value;
    }
    public static long nonnegativeExact(BigDecimal value) {
        long result = exact(value);
        if (result < 0) throw new ArithmeticException("Ungültige Centgrenze");
        return result;
    }
    public static long subtract(long left, long right) { return exact(Math.subtractExact(left, right)); }
    private Money() {}
}
