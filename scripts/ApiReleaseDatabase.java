import java.sql.DriverManager;
import java.sql.Connection;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.io.BufferedReader;
import java.io.InputStreamReader;

/** Administrativer JDBC-Kanal; die exklusive DB-Sperre bleibt bis Kanalende gehalten. */
class ApiReleaseDatabase {
    static String execute(Connection connection, String sql) throws Exception {
        try (var statement = connection.createStatement()) {
            statement.setQueryTimeout(15);
            var output = new StringBuilder();
            if (statement.execute(sql)) try (var result = statement.getResultSet()) {
                while (result.next()) {
                    if (!output.isEmpty()) output.append('\n');
                    output.append(result.getString(1));
                }
            }
            return output.toString();
        }
    }
    public static void main(String[] args) throws Exception {
        Class.forName("org.postgresql.Driver");
        try (var connection = DriverManager.getConnection(System.getenv("RELEASE_DB_URL"),
                System.getenv("DB_ADMIN_USER"), System.getenv("DB_ADMIN_PASSWORD"))) {
            if (args.length == 0) {
                System.out.print(execute(connection, new String(System.in.readAllBytes(), StandardCharsets.UTF_8)));
                return;
            }
            // PostgreSQL advisory locks are scoped to the actual database, across
            // host aliases and local metadata directories, including pre-V10 bootstrap.
            try (var lock = connection.createStatement()) {
                lock.execute("SELECT pg_advisory_lock(2073657927, 37)");
            }
            System.out.println("READY"); System.out.flush();
            var input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            for (String line; (line = input.readLine()) != null && !line.equals("QUIT");) {
                try {
                    String sql = new String(Base64.getDecoder().decode(line), StandardCharsets.UTF_8);
                    String result = execute(connection, sql);
                    System.out.println("OK " + Base64.getEncoder().encodeToString(result.getBytes(StandardCharsets.UTF_8)));
                    System.out.flush();
                } catch (Exception failure) {
                    System.out.println("ERROR " + Base64.getEncoder().encodeToString(failure.toString().getBytes(StandardCharsets.UTF_8)));
                    System.out.flush();
                    // No reconnect: losing this connection ends the entire critical phase.
                    return;
                }
            }
        }
    }
}
