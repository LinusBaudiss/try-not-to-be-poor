import java.nio.file.*;
import java.util.*;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.engine.support.descriptor.MethodSource;
import org.junit.platform.launcher.*;
import org.junit.platform.launcher.core.*;

/** Discovery only: never executes tests or initializes their PostgreSQL fixtures. */
class DiscoverTests {
    public static void main(String[] args) throws Exception {
        var builder = LauncherDiscoveryRequestBuilder.request();
        try (var files = Files.walk(Path.of("backend/target/test-classes"))) {
            files.filter(p -> p.toString().endsWith("Test.class") || p.toString().endsWith("IT.class"))
                .filter(p -> !p.toString().contains("$"))
                .sorted().forEach(p -> builder.selectors(DiscoverySelectors.selectClass(
                    Path.of("backend/target/test-classes").relativize(p).toString()
                        .replace('/', '.').replaceAll("\\.class$", ""))));
        }
        var plan = LauncherFactory.create().discover(builder.build());
        var rows = new TreeSet<String>();
        for (var root : plan.getRoots()) {
            for (var id : plan.getDescendants(root)) {
                id.getSource().filter(source -> source instanceof MethodSource).ifPresent(source -> {
                    var method = (MethodSource) source;
                    rows.add(method.getClassName() + "\t" + method.getMethodName() + "\t" + id.getUniqueId());
                });
            }
        }
        System.out.println("execution_class\tmethod\tjunit_unique_id");
        rows.forEach(System.out::println);
    }
}
