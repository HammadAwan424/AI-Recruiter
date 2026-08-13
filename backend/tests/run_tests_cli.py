import os
import sys
import time
import subprocess

TEST_FILES = [
    {
        "id": "1",
        "filename": "test_01_extract.py",
        "description": "Stage 1: Extract raw text from PDF resume -> 01_cv_text.txt"
    },
    {
        "id": "2",
        "filename": "test_02_parse.py",
        "description": "Stage 2: Parse structured profile from text -> 02_parsed_profile.json"
    },
    {
        "id": "3",
        "filename": "test_03_screen.py",
        "description": "Stage 3: Run AI candidate screening evaluation -> 03_screening_result.json"
    },
    {
        "id": "4",
        "filename": "test_04_get_after_date.py",
        "description": "Stage 4: Derive search date bound -> 04_after_date.json"
    },
    {
        "id": "5",
        "filename": "test_05_get_deduped_mails.py",
        "description": "Stage 5: Query Gmail API & deduplicate against DB -> 05_deduped_mails.json"
    },
    {
        "id": "6",
        "filename": "test_06_process_mails.py",
        "description": "Stage 6: Process deduped emails & extract CV text -> 06_processed_applications.json"
    },
    {
        "id": "7",
        "filename": "test_07_persist_applications.py",
        "description": "Stage 7: Persist applications & candidates in DB -> 07_persistence_result.json"
    },
    {
        "id": "8",
        "filename": "test_08_send_email.py",
        "description": "Stage 8: Send outbound email via Gmail API -> 08_send_email_result.json"
    }
]


def display_menu():
    print("\n===================================================================")
    print("           INTERACTIVE RECRUITER AI TEST RUNNER                    ")
    print("===================================================================")
    for test in TEST_FILES:
        print(f"  [{test['id']}] {test['filename']:<32} - {test['description']}")
    print("  [A] Run All Tests Sequentially (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8)")
    print("  [Q] Quit")
    print("===================================================================")


def run_test_file(filename: str) -> tuple[int, float]:
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(tests_dir, filename)

    if not os.path.exists(file_path):
        print(f"\n❌ Error: Test file '{filename}' not found at {file_path}")
        return 1, 0.0

    print(f"\n>>> Running {filename}...\n" + "-" * 60)
    start_time = time.time()
    result = subprocess.run([sys.executable, file_path], cwd=tests_dir)
    elapsed_time = time.time() - start_time
    print("-" * 60)
    if result.returncode == 0:
        print(f"✓ {filename} finished successfully in {elapsed_time:.2f}s (Exit Code 0)\n")
    else:
        print(f"❌ {filename} failed in {elapsed_time:.2f}s with Exit Code {result.returncode}\n")
    return result.returncode, elapsed_time


def main():
    while True:
        display_menu()
        try:
            choice = input("Select a test number to run: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting test runner.")
            break

        if choice in ["q", "quit", "exit"]:
            print("Exiting test runner.")
            break
        elif choice == "a":
            print("\n=== RUNNING ALL PIPELINE TESTS IN SEQUENCE ===")
            start_all_time = time.time()
            results = []
            for test in TEST_FILES:
                code, elapsed = run_test_file(test["filename"])
                results.append((test["filename"], code, elapsed))
                if code != 0:
                    print(f"⚠️ Pipeline halted due to error in {test['filename']}")
                    break
            total_elapsed = time.time() - start_all_time
            print("\n" + "=" * 65)
            print("                 TEST EXECUTION TIMING SUMMARY                   ")
            print("=" * 65)
            for fname, code, elapsed in results:
                status_str = "PASSED" if code == 0 else "FAILED"
                print(f"  {fname:<32} [{status_str:<6}] {elapsed:.2f}s")
            print("-" * 65)
            print(f"  Total Duration: {total_elapsed:.2f}s")
            print("=" * 65 + "\n")
        else:
            selected = next((t for t in TEST_FILES if t["id"] == choice), None)
            if selected:
                run_test_file(selected["filename"])
            else:
                print(f"Invalid option '{choice}'. Please select a valid number from the menu.")


if __name__ == "__main__":
    main()

