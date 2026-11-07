import json
import shutil
from pathlib import Path

import pytest
from pydantic import ValidationError

from pillplan_tools.catalog import area_counts, read_catalog, render_tex
from pillplan_tools.catalog.build import ROOT, main, render_json

DATA = ROOT / "data-src"


@pytest.fixture
def data_copy(tmp_path: Path) -> Path:
    target = tmp_path / "data-src"
    shutil.copytree(DATA, target)
    return target


def _replace(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    assert old in text, f"fixture text not found: {old}"
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def test_real_catalog_is_valid() -> None:
    catalog = read_catalog(DATA)
    assert len(catalog.drugs) >= 35
    assert all(drug.source for drug in catalog.drugs)


def test_combination_product_keeps_amounts_per_ingredient() -> None:
    catalog = read_catalog(DATA)
    combo = next(d for d in catalog.drugs if d.id == "paracetamol_caffeine")
    assert combo.ingredients == ("paracetamol", "caffeine")
    assert combo.strengths == ((500.0, 65.0),)


def test_prn_drugs_have_no_fixed_times() -> None:
    catalog = read_catalog(DATA)
    paracetamol = next(d for d in catalog.drugs if d.id == "paracetamol")
    assert paracetamol.default_prn
    assert paracetamol.default_times == ()


def test_unknown_ingredient_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "drugs.csv", ",metformin,Biguanide", ",metformine,Biguanide")
    with pytest.raises(ValidationError, match="unknown ingredient 'metformine'"):
        read_catalog(data_copy)


def test_unknown_warning_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "drugs.csv", "drowsy;alcohol;dont_stop", "drowsy;alcohol;nope")
    with pytest.raises(ValidationError, match="unknown warnings"):
        read_catalog(data_copy)


def test_duplicate_drug_id_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "drugs.csv", "loratadine,Loratadine", "cetirizine,Loratadine")
    with pytest.raises(ValidationError, match="duplicate drug id 'cetirizine'"):
        read_catalog(data_copy)


def test_strength_must_match_ingredient_count(data_copy: Path) -> None:
    _replace(data_copy / "drugs.csv", ",500+65,", ",500,")
    with pytest.raises(ValidationError, match="one amount per ingredient"):
        read_catalog(data_copy)


def test_unit_above_daily_maximum_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "ingredients.csv", "amlodipine,Amlodipine,10,", "amlodipine,Amlodipine,4,")
    with pytest.raises(ValidationError, match="above the usual daily maximum"):
        read_catalog(data_copy)


def test_unit_mismatch_is_rejected(data_copy: Path) -> None:
    _replace(
        data_copy / "ingredients.csv",
        "levothyroxine,Levothyroxine,,mcg",
        "levothyroxine,Levothyroxine,,mg",
    )
    with pytest.raises(ValidationError, match="does not match levothyroxine"):
        read_catalog(data_copy)


def test_em_dash_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "drugs.csv", "Take once a day.", "Take once a day \u2014 morning.")
    with pytest.raises(ValidationError, match="em or en dashes"):
        read_catalog(data_copy)


def test_json_uses_camel_case_and_is_stable() -> None:
    catalog = read_catalog(DATA)
    first = render_json(catalog)
    assert first == render_json(read_catalog(DATA))
    drug = json.loads(first)["drugs"][0]
    assert {"drugClass", "defaultTimes", "bestTimes", "defaultPrn"} <= drug.keys()


def test_missing_translation_is_rejected(data_copy: Path) -> None:
    _replace(data_copy / "terms.csv", "Statin,Statin\n", "")
    with pytest.raises(ValueError, match="no Indonesian text for 'Statin'"):
        read_catalog(data_copy)


def test_text_is_bilingual() -> None:
    catalog = read_catalog(DATA)
    simvastatin = next(d for d in catalog.drugs if d.id == "simvastatin")
    assert simvastatin.advice.id == "Biasanya diminum pada malam hari."
    assert next(d for d in catalog.drugs if d.id == "paracetamol").aliases == ("parasetamol",)


def test_area_counts_cover_every_drug() -> None:
    catalog = read_catalog(DATA)
    assert sum(count for _, count in area_counts(catalog)) == len(catalog.drugs)
    assert f"\\newcommand{{\\CatalogDrugs}}{{{len(catalog.drugs)}}}" in render_tex(catalog)


def test_committed_outputs_are_up_to_date() -> None:
    assert main(["--check"]) == 0
