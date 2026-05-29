import Input from "@/components/Input/Input";
import { maskCurrencyInput } from "@/lib/currencyInput";

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  ...props
}) {
  function handleChange(event) {
    const masked = maskCurrencyInput(event.target.value);
    onChange?.({
      ...event,
      target: { ...event.target, value: masked },
    });
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
    />
  );
}
