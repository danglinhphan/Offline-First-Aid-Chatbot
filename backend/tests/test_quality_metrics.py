import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.rag import rag_engine


def test_retrieval_handles_medical_synonyms():
    result = rag_engine.query("bị ngộp")
    assert result is not None
    assert result["caseKey"] == "choking"


def test_retrieval_handles_emergency_variants():
    result = rag_engine.query("người không thở và bất tỉnh")
    assert result is not None
    assert result["caseKey"] == "cpr"


def test_retrieval_handles_burns_and_stroke_queries():
    burns_result = rag_engine.query("bỏng nước sôi tay")
    assert burns_result is not None
    assert burns_result["caseKey"] == "burns"

    stroke_result = rag_engine.query("đột ngột méo miệng")
    assert stroke_result is not None
    assert stroke_result["caseKey"] == "stroke"


def test_retrieval_handles_bleeding_queries():
    bleeding_result = rag_engine.query("chảy máu nhiều từ vết thương")
    assert bleeding_result is not None
    assert bleeding_result["caseKey"] == "bleeding"


def test_retrieval_handles_choking_paraphrases():
    choking_result = rag_engine.query("dễ bị nghẹn khi ăn")
    assert choking_result is not None
    assert choking_result["caseKey"] == "choking"

    suffocation_result = rag_engine.query("người bị ngạt do thức ăn")
    assert suffocation_result is not None
    assert suffocation_result["caseKey"] == "choking"


def test_retrieval_ignores_irrelevant_queries():
    result = rag_engine.query("viết một trang web bằng react")
    assert result is None
