package de.linus.tnbp.access;

import static org.assertj.core.api.Assertions.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MonthlyAutomationE2eServerTest {
    @Test void bereinigungBeendetAbgekoppelteSitzungUndUeberzogenenStilllegungsprozess(@TempDir Path folder) throws Exception {
        var resources=new MonthlyAutomationE2eServer.LocalResources();resources.root=folder;resources.folder=folder;
        resources.environment=java.util.Map.of();
        resources.stopCommand=java.util.List.of("python3","-c","import pathlib,sys; pathlib.Path(sys.argv[1],'stop').write_text('geordnet')",folder.toString());
        ProcessHandle detached=null;
        try {
            var launcher=resources.start(new ProcessBuilder("python3","-c","""
                import subprocess,sys,pathlib
                script="import signal,time,sys,pathlib; signal.signal(signal.SIGTERM,lambda *_: (pathlib.Path(sys.argv[1],'graceful').write_text('beendet'),sys.exit(0))); pathlib.Path(sys.argv[1],'ready').touch(); time.sleep(120)"
                child=subprocess.Popen([sys.executable,'-c',script,sys.argv[1]],start_new_session=True)
                pathlib.Path(sys.argv[1],'child').write_text(str(child.pid))
                """,folder.toString()));
            assertThat(launcher.waitFor(5,TimeUnit.SECONDS)).isTrue();
            detached=ProcessHandle.of(Long.parseLong(Files.readString(folder.resolve("child")))).orElseThrow();
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);
            while(!Files.exists(folder.resolve("ready"))&&System.nanoTime()<deadline)Thread.sleep(10);
            assertThat(folder.resolve("ready")).exists();
            var overdue=resources.start(new ProcessBuilder("python3","-c","import signal,time; signal.signal(signal.SIGTERM,signal.SIG_IGN); print('bereit',flush=True); time.sleep(120)"));
            assertThat(overdue.inputReader().readLine()).isEqualTo("bereit");
            assertThat(detached.isAlive()).isTrue();
            resources.close();
            assertThat(overdue.isAlive()).isFalse();assertThat(detached.isAlive()).isFalse();
            assertThat(folder.resolve("stop")).hasContent("geordnet");assertThat(folder.resolve("graceful")).hasContent("beendet");
            resources.close();
        } finally {resources.close();if(detached!=null&&detached.isAlive())detached.destroyForcibly();}
    }
}
