import subprocess
import sys
import time
from pathlib import Path


TEST_FILES = [
    ("1", "extraction/test_extract_resume.py", "Extract resume text -> tests/.artifacts/extraction"),
    ("2", "extraction/test_agent__parse_resume.py", "Parse resume -> tests/.artifacts/extraction"),
    ("3", "extraction/test_agent__screen_resume.py", "Screen resume -> tests/.artifacts/extraction"),
    ("4", "gmail/test_prepare_sync_context.py", "Prepare company Gmail context -> tests/.artifacts/gmail"),
    ("5", "gmail/test_deduplicate_messages.py", "Deduplicate Gmail IDs -> tests/.artifacts/gmail"),
    ("6", "gmail/test_process_messages.py", "Process Gmail messages -> tests/.artifacts/gmail"),
    ("7", "gmail/test_agent__job_classification.py", "Classify Gmail messages -> tests/.artifacts/gmail"),
    ("8", "gmail/test_persist_applications.py", "Persist applications -> tests/.artifacts/gmail"),
    ("9", "gmail/test_send_email.py", "Send outbound email -> tests/.artifacts/gmail"),
]


def display_menu() -> None:
    print("\n===================================================================")
    print("           AI RECRUITER MANUAL PIPELINE TEST RUNNER                ")
    print("===================================================================")
    for test_id, filename, description in TEST_FILES:
        print(f"  [{test_id}] {filename:<48} - {description}")
    print("  [A] Run all stages sequentially")
    print("  [Q] Quit")
    print("===================================================================")


def run_test_file(filename: str) -> tuple[int, float]:
    tests_dir = Path(__file__).resolve().parent
    backend_root = tests_dir.parent
    file_path = tests_dir / filename
    if not file_path.exists():
        print(f"\n❌ Test file not found: {file_path}")
        return 1, 0.0

    print(f"\n>>> Running {filename}...\n" + "-" * 60)
    started = time.time()
    result = subprocess.run([sys.executable, str(file_path)], cwd=backend_root)
    elapsed = time.time() - started
    print("-" * 60)
    status = "✓" if result.returncode == 0 else "❌"
    print(f"{status} {filename} finished in {elapsed:.2f}s (exit {result.returncode})\n")
    return result.returncode, elapsed


def main() -> None:
    while True:
        display_menu()
        try:
            choice = input("Select a test number: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting test runner.")
            return

        if choice in {"q", "quit", "exit"}:
            return
        if choice == "a":
            for _, filename, _ in TEST_FILES:
                code, _ = run_test_file(filename)
                if code:
                    print("⚠️ Pipeline halted after the failed stage.")
                    break
            continue

        selected = next((filename for test_id, filename, _ in TEST_FILES if test_id == choice), None)
        if selected:
            run_test_file(selected)
        else:
            print(f"Invalid option: {choice}")


if __name__ == "__main__":
    main()
