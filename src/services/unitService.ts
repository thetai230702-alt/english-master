
import type { Unit } from "../types/unit";

export async function getUnits(): Promise<Unit[]> {
  const response = await fetch("/data/units.json");

  if (!response.ok) {
    throw new Error("Không thể tải dữ liệu 50 Unit.");
  }

  const units: Unit[] = await response.json();

  return units;
}

export async function getUnitByNumber(
  unitNumber: number
): Promise<Unit | undefined> {
  const units = await getUnits();

  return units.find((unit) => unit.unitNumber === unitNumber);
}
