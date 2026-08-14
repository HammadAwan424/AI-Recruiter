import base64


class FakeExecute:
    def __init__(self, value):
        self.value = value

    def execute(self):
        return self.value


class FakeGmailResource:
    def __init__(self, messages):
        self.messages_by_id = messages

    def users(self):
        return self

    def messages(self):
        return self

    def get(self, userId, id, format):
        return FakeExecute(self.messages_by_id[id])


def encode_body(value: str) -> str:
    return base64.urlsafe_b64encode(value.encode("utf-8")).decode("ascii").rstrip("=")
