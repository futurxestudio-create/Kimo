import re

with open('src/components/CotizadorView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace WorkshopOperatingBudget usage
c = c.replace(
    'const opBudget = settings.operatingBudget || {} as any;',
    '''
  const { calculateTotalOverheadPerHour } = useWorkshop();
  const masterOverheadRate = calculateTotalOverheadPerHour();
    '''
)

# Replace lines 148-163 with our new masterOverheadRate
old_budget = r'''  const totalFixedMonthlyOpex =.*?const totalAbsorcionPorHora = Number\(\(overheadRatePerHour \+ workshopSuppliesRatePerHour\)\.toFixed\(2\)\);'''
c = re.sub(old_budget, '', c, flags=re.DOTALL)

# Now find where it calculates mOverheadCost and mWorkshopSuppliesCost
# We just replace both with one single master overhead or we separate them. The user says:
# "multiplicar esa tasa por las horas de impresión"
# Let's replace mWorkshopSuppliesCost and mOverheadCost entirely.

c = c.replace(
    'const mWorkshopSuppliesCost = includeWorkshopSupplies ? mHoursWithBuffer * workshopSuppliesRatePerHour : 0;',
    '// Insumos Taller (Ya absorbidos en masterOverheadRate)\n    const mWorkshopSuppliesCost = 0;'
)

c = c.replace(
    'const mOverheadCost = includeOverhead ? mHoursWithBuffer * overheadRatePerHour : 0;',
    '// Absorción maestra (CAPEX + OPEX + Insumos/hr)\n    const mOverheadCost = includeOverhead ? mHoursWithBuffer * masterOverheadRate : 0;'
)

with open('src/components/CotizadorView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
