import logging
from abc import ABC, abstractmethod

logger = logging.getLogger("liyuid.integrations.sms")


class SMSProvider(ABC):
    @abstractmethod
    def send_sms(self, phone_number: str, message: str) -> bool:
        pass


class StubSMSProvider(SMSProvider):
    """
    TODO: Integrate local telecommunications SMS Gateway (e.g. Ethio Telecom SMPP/API).
    """
    def send_sms(self, phone_number: str, message: str) -> bool:
        logger.info(f"[SMS STUB] Sent SMS to {phone_number}: {message}")
        return True


sms_client = StubSMSProvider()


def send_owner_municipal_intake_sms(
    owner_phone: str,
    item_title: str,
    station_location: str,
    shelf_locker: str,
) -> bool:
    """
    Dispatches automated SMS notification to owner upon municipal item intake and shelf tagging.
    Option C: Automatic Shelf Assignment & Citizen SMS.
    """
    sms_text = (
        f"LIYUID Alert: Your item ({item_title}) is stored at {station_location}, "
        f"Shelf/Locker: {shelf_locker}. Present your Claim Pass & 6-digit OTP to the municipal officer to claim it. "
        f"(ሊዩይድ ማስታወቂያ፡ እቃዎ በ{station_location} መደርደሪያ {shelf_locker} ተቀምጧል። እቃውን ለመረከብ የይገባኛል ማለፊያዎን እና OTP ኮድዎን ለኦፊሰሩ ያሳዩ።)"
    )
    logger.info(f"[SMS DISPATCH] Sending municipal intake SMS to {owner_phone}: {sms_text}")
    return sms_client.send_sms(owner_phone, sms_text)

