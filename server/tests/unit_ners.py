import pytest
import logging


from app.ner.NamedEntityExtraction import NamedEntity, EntityRecognition

@pytest.fixture(scope="module")
def entity_recognition_class() -> EntityRecognition:
    return EntityRecognition()

def test_extract_ners_from_text(entity_recognition_class: EntityRecognition):
    logging.info(entity_recognition_class.extract_named_entities("""Subject: Urgent: Zero-Day Vector via Zoom on Local Access Point

Hey John,

Just a heads-up — I intercepted anomalous telemetry from our subnet suggesting a potential zero-day exploit vector propagating via an obfuscated Zoom payload. It’s triggering sporadic handshake failures at the access point level (WPA2-PSK spectrum, channel 11 specifically).

Recommend immediate sandboxing of all Zoom sessions and a temporary kill-switch on the broadcast SSID until we can establish whether the threat surface is internal or part of a lateral move from an upstream node. Let’s circle back once logs are parsed and the entropy levels normalize.

Stay vigilant,
Isa"""))
    