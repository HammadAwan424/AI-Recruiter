import unittest
from datetime import datetime, timedelta

from app.utils.ical_generator import generate_ical_event


class IcalGeneratorTests(unittest.TestCase):
    def test_generates_event_for_scheduled_interview(self):
        start = datetime(2030, 1, 1, 9, 0)
        end = start + timedelta(hours=1)

        content = generate_ical_event(
            title="Backend Engineer Interview",
            description="Technical interview",
            start_time=start,
            end_time=end,
            location_url="https://meet.example.com/interview",
        )

        self.assertIn("DTSTART:20300101T090000Z", content)
        self.assertIn("DTEND:20300101T100000Z", content)

    def test_rejects_unscheduled_interview(self):
        with self.assertRaisesRegex(ValueError, "requires both a start time"):
            generate_ical_event(
                title="Backend Engineer Interview",
                description="Technical interview",
                start_time=None,
                end_time=None,
                location_url="https://meet.example.com/interview",
            )


if __name__ == "__main__":
    unittest.main()
