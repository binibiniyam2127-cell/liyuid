from enum import Enum


class SubCityEnum(str, Enum):
    addis_ketema = "Addis Ketema"
    akaky_kaliti = "Akaky Kaliti"
    arada = "Arada"
    bole = "Bole"
    gullele = "Gullele"
    kirkos = "Kirkos"
    kolfe_keranio = "Kolfe Keranio"
    lideta = "Lideta"
    nifas_silk_lafto = "Nifas Silk-Lafto"
    yeka = "Yeka"
    lemi_kura = "Lemi Kura"


class ItemCategoryEnum(str, Enum):
    electronics = "electronics"
    documents_ids = "documents_ids"
    wallets_cards = "wallets_cards"
    keys = "keys"
    jewelry_accessories = "jewelry_accessories"
    bags_luggage = "bags_luggage"
    clothing = "clothing"
    other = "other"


class ProofKindEnum(str, Enum):
    imei = "imei"
    id_last4 = "id_last4"
    contents = "contents"
    keychain = "keychain"
    other = "other"


__all__ = [
    "SubCityEnum",
    "ItemCategoryEnum",
    "ProofKindEnum",
]
