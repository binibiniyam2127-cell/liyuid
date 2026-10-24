from app.schemas.auth import (
    RefreshTokenRequest,
    StaffLoginRequest,
    Token,
    UserRegister,
    UserResponse,
    VerifyOtpRequest,
)
from app.schemas.common import ItemCategoryEnum, ProofKindEnum, SubCityEnum
from app.schemas.handover import (
    HandoverConfirmRequest,
    HandoverResponse,
    MunicipalIntakePayload,
    MunicipalIntakeResponse,
    MunicipalReleasePayload,
    MunicipalReleaseResponse,
    NotifyMunicipalDropoffPayload,
    NotifyMunicipalDropoffResponse,
)
from app.schemas.matches import (
    AnswerVerificationRequest,
    AnswerVerificationResponse,
    ChatMessagePayload,
    ChatMessageResponse,
    ConfirmMatchCodePayload,
    EscalateUnresponsivePayload,
    PhotoVerificationResponse,
    ProofVerificationRequest,
    ProofVerificationResponse,
    QuestionOption,
    QuestionResponse,
    ReviewRequestPayload,
    ReviewRequestResponse,
    VerificationStateResponse,
)
from app.schemas.reports import (
    ClaimVerifyPayload,
    ItemResponse,
    MatchCandidate,
    MatchItemDetail,
    ReportCreate,
)
from app.schemas.settings import FinderRequestResponse, UserSettingsResponse
from app.schemas.staff import FlagResponse, ResolveFlagPayload

__all__ = [
    # Common Enums
    "SubCityEnum",
    "ItemCategoryEnum",
    "ProofKindEnum",
    # Auth
    "UserRegister",
    "VerifyOtpRequest",
    "UserResponse",
    "Token",
    "RefreshTokenRequest",
    "StaffLoginRequest",
    # Reports
    "ReportCreate",
    "ItemResponse",
    "MatchCandidate",
    "MatchItemDetail",
    "ClaimVerifyPayload",
    # Matches
    "VerificationStateResponse",
    "PhotoVerificationResponse",
    "ProofVerificationRequest",
    "ProofVerificationResponse",
    "QuestionOption",
    "QuestionResponse",
    "AnswerVerificationRequest",
    "AnswerVerificationResponse",
    "ReviewRequestPayload",
    "ReviewRequestResponse",
    "ConfirmMatchCodePayload",
    "EscalateUnresponsivePayload",
    "ChatMessagePayload",
    "ChatMessageResponse",
    # Handover
    "HandoverConfirmRequest",
    "HandoverResponse",
    "NotifyMunicipalDropoffPayload",
    "NotifyMunicipalDropoffResponse",
    "MunicipalIntakePayload",
    "MunicipalIntakeResponse",
    "MunicipalReleasePayload",
    "MunicipalReleaseResponse",
    # Staff
    "FlagResponse",
    "ResolveFlagPayload",
    # Settings
    "UserSettingsResponse",
    "FinderRequestResponse",
]
