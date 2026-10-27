package de.linus.tnbp.finance;

import static org.assertj.core.api.Assertions.*;
import de.linus.tnbp.budget.Budgets;
import de.linus.tnbp.expenses.Expenses;
import de.linus.tnbp.savingsgoals.SavingsGoals;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ArchitectureTest {
    static Path projectRoot() {
        Path here = Path.of("").toAbsolutePath();
        return Files.isDirectory(here.resolve("backend")) ? here : here.getParent();
    }

    @Test void fachmoduleImportierenNurEigeneZugaengeUndTechnischeInfrastruktur() throws Exception {
        Path java = projectRoot().resolve("backend/src/main/java/de/linus/tnbp");
        var imports = Pattern.compile("\\bde\\.linus\\.tnbp\\.([a-z]+)\\.");
        for (String owner : List.of("access", "expenses", "budget", "savingsgoals", "shared")) {
            try (var paths = Files.walk(java.resolve(owner))) {
                for (Path file : paths.filter(path -> path.toString().endsWith(".java")).toList()) {
                    String source = Files.readString(file);
                    var matcher = imports.matcher(source);
                    while (matcher.find()) assertThat(matcher.group(1)).as(file.toString())
                        .isIn(owner, "shared", "contract");
                    if (!owner.equals("access") && !owner.equals("shared")) {
                        assertThat(source).as(file.toString()).doesNotContain("TransactionTemplate", "@Transactional",
                            "PlatformTransactionManager", "java.time.Clock", ".commit(", ".rollback(");
                    }
                    assertSchemaOwnership(owner, source, file);
                }
            }
        }
        if (Files.exists(java.resolve("expensebudget"))) assertThat(java.resolve("expensebudget")).isEmptyDirectory();
        assertOuterApplications(java.resolve("finance"));
        try (var paths = Files.walk(java.resolve("finance/http"))) {
            for (Path path : paths.filter(file -> file.toString().endsWith("Controller.java")).toList())
                assertThat(Files.readString(path)).contains("FinanceApplication").doesNotContain("Repository", "JdbcTemplate", "FinanceTransactions");
        }
    }

    @Test void quotiertesUndJavaEscaptesFremdSqlWirdEbensoAbgewiesenWieUnquotiertesSql() {
        for (String sql : List.of(
            "SELECT * FROM budget.budgets",
            "SELECT * FROM \"budget\".\"budgets\"",
            "String sql = \"SELECT * FROM \\\"budget\\\".\\\"budgets\\\"\";",
            "UPDATE \\\"budget\\\" . \\\"budgets\\\" SET amount_cents = 1",
            "SELECT * FROM\\n\\\"budget\\\".\\\"budgets\\\"")) {
            assertThatThrownBy(() -> assertSchemaOwnership("expenses", sql, Path.of("Expenses.java")))
                .as(sql).isInstanceOf(AssertionError.class).hasMessageContaining("SQL-Datenbesitz");
            assertThatCode(() -> assertSchemaOwnership("budget", sql, Path.of("Budgets.java"))).doesNotThrowAnyException();
        }
    }

    @Test void auchWeitereUndVerschachtelteAeussereAnwendungsklassenDuerfenNichtDirektAufDatenZugreifen(@TempDir Path finance) throws Exception {
        Files.writeString(finance.resolve("FinanceApplication.java"), "class FinanceApplication {}");
        Path nested = Files.createDirectories(finance.resolve("additional"));
        Path extra = nested.resolve("OtherApplication.java");
        for (String violation : List.of(
            "class OtherApplication { String sql = \"SELECT * FROM \\\"expenses\\\".\\\"expenses\\\"\"; }",
            "class OtherApplication { JdbcClient database; }",
            "class OtherApplication { ExpenseRepository expenses; }")) {
            Files.writeString(extra, violation);
            assertThatThrownBy(() -> assertOuterApplications(finance)).as(violation).isInstanceOf(AssertionError.class);
        }
        Files.writeString(extra, "class OtherApplication { de.linus.tnbp.expenses.Expenses expenses; }");
        assertThatCode(() -> assertOuterApplications(finance)).doesNotThrowAnyException();
    }

    private static String decodedSource(String source) {
        return source.replace("\\\"", "\"").replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t");
    }

    private static void assertSchemaOwnership(String owner, String source, Path file) {
        var schemaOwners = Map.of("expenses", "expenses", "budget", "budget", "savings_goals", "savingsgoals", "access", "access");
        var sql = Pattern.compile("(?i)\\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\\s+\"?([a-z_][a-z0-9_]*)\"?\\s*\\.")
            .matcher(decodedSource(source));
        while (sql.find()) {
            String schemaOwner = schemaOwners.get(sql.group(1).toLowerCase(Locale.ROOT));
            if (schemaOwner != null) assertThat(schemaOwner).as("SQL-Datenbesitz in %s", file).isEqualTo(owner);
        }
    }

    private static void assertOuterApplications(Path finance) throws Exception {
        try (var paths = Files.walk(finance)) {
            for (Path file : paths.filter(path -> path.toString().endsWith(".java") && !path.startsWith(finance.resolve("http"))).toList()) {
                String source = decodedSource(Files.readString(file));
                assertThat(source).as(file.toString()).doesNotContain("JdbcTemplate", "JdbcClient", "Repository", "DataSource", "java.sql.", "EntityManager")
                    .doesNotContainPattern("(?i)\\b(?:SELECT|UPDATE|INSERT|DELETE|MERGE)\\s");
            }
        }
    }

    @Test void oeffentlicheProjektionenExportierenKeineRepositorytypen() {
        for (Class<?> facade : List.of(Expenses.class, Budgets.class, SavingsGoals.class)) {
            for (var method : facade.getMethods()) {
                assertThat(method.toGenericString()).doesNotContain("Repository");
            }
            for (var constructor : facade.getConstructors()) assertThat(constructor.toGenericString()).doesNotContain("Repository");
        }
    }
}
