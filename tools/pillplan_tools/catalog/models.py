"""Typed models for the drug catalog, with the cross-row rules that keep it trustworthy."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from pydantic.alias_generators import to_camel

TimeSlot = Literal["morning", "noon", "evening", "bedtime"]
Food = Literal["before", "with_after", "any"]
DrugForm = Literal["tablet", "capsule"]
DoseUnit = Literal["mg", "mcg"]
StickerColor = Literal["yellow", "red", "blue"]

Slug = Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9_]*$")]
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]

BANNED_DASHES = ("\u2014", "\u2013")


class _Model(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
        alias_generator=to_camel,
        populate_by_name=True,
    )


class LocalText(_Model):
    """The same text in English and Indonesian."""

    en: Text
    id: Text


class WarningLabel(_Model):
    id: Slug
    short: LocalText
    text: LocalText
    icon: Slug
    sticker: StickerColor


class Ingredient(_Model):
    id: Slug
    name: Text
    usual_max_daily: float | None = Field(default=None, gt=0)
    unit: DoseUnit
    source: Text


class Drug(_Model):
    id: Slug
    name: Text
    aliases: tuple[Text, ...]
    brands: tuple[Text, ...]
    ingredients: tuple[Slug, ...] = Field(min_length=1)
    drug_class: LocalText
    area: LocalText
    form: DrugForm
    strengths: tuple[tuple[float, ...], ...] = Field(min_length=1)
    unit: DoseUnit
    default_times: tuple[TimeSlot, ...]
    default_prn: bool
    best_times: tuple[TimeSlot, ...]
    food: Food
    warnings: tuple[Slug, ...]
    advice: LocalText
    source: Text

    @model_validator(mode="after")
    def _check_shape(self) -> Self:
        for option in self.strengths:
            if len(option) != len(self.ingredients):
                raise ValueError(
                    f"{self.id}: each strength needs one amount per ingredient "
                    f"({len(self.ingredients)}), got {option}"
                )
            if any(amount <= 0 for amount in option):
                raise ValueError(f"{self.id}: strengths must be positive, got {option}")
        if not self.default_prn and not self.default_times:
            raise ValueError(f"{self.id}: needs default times or 'prn'")
        if self.default_prn and self.default_times:
            raise ValueError(f"{self.id}: 'prn' cannot be mixed with fixed times")
        return self


class Catalog(_Model):
    version: int = 1
    warnings: tuple[WarningLabel, ...]
    ingredients: tuple[Ingredient, ...]
    drugs: tuple[Drug, ...]

    @model_validator(mode="after")
    def _check_references(self) -> Self:
        _require_unique("warning", [w.id for w in self.warnings])
        _require_unique("ingredient", [i.id for i in self.ingredients])
        _require_unique("drug", [d.id for d in self.drugs])

        warning_ids = {w.id for w in self.warnings}
        ingredients = {i.id: i for i in self.ingredients}
        for drug in self.drugs:
            unknown = set(drug.warnings) - warning_ids
            if unknown:
                raise ValueError(f"{drug.id}: unknown warnings {sorted(unknown)}")
            for index, ingredient_id in enumerate(drug.ingredients):
                ingredient = ingredients.get(ingredient_id)
                if ingredient is None:
                    raise ValueError(f"{drug.id}: unknown ingredient '{ingredient_id}'")
                if ingredient.unit != drug.unit:
                    raise ValueError(
                        f"{drug.id}: unit {drug.unit} does not match {ingredient_id} "
                        f"({ingredient.unit})"
                    )
                biggest = max(option[index] for option in drug.strengths)
                limit = ingredient.usual_max_daily
                if limit is not None and biggest > limit:
                    raise ValueError(
                        f"{drug.id}: one {biggest} {drug.unit} unit is above the usual "
                        f"daily maximum of {ingredient_id} ({limit})"
                    )

        _reject_dashes(str(self.model_dump()))
        return self


def _require_unique(kind: str, ids: list[str]) -> None:
    seen: set[str] = set()
    for item in ids:
        if item in seen:
            raise ValueError(f"duplicate {kind} id '{item}'")
        seen.add(item)


def _reject_dashes(text: str) -> None:
    for dash in BANNED_DASHES:
        if dash in text:
            raise ValueError("catalog text must not contain em or en dashes")
