import { useEffect, useRef, useState } from "react";
import { type Address } from "../../types/address";
import { t } from "../../i18n";
import { MEXICAN_STATES, POSTAL_CODE_PATTERN } from "../../utils/mexico";
import { getPostalCodeApi, type PostalCodeInfo } from "../../api/postalCodes";

const isMexicanState = (value: string) =>
    (MEXICAN_STATES as readonly string[]).includes(value);

const isFullPostalCode = (value: string) => /^\d{5}$/.test(value);

interface Props {
    initialAddress?: Address;
    onChange: (address: Address) => void;
}

export default function AddressForm({ initialAddress, onChange }: Props) {
    const [address, setAddress] = useState<Address>(initialAddress || {
        first_name: "",
        last_name: "",
        phone: "",
        street: "",
        exterior_number: "",
        interior_number: "",
        neighborhood: "",
        city: "",
        state: "",
        postal_code: "",
        special_instructions: "",
    });
    const [place, setPlace] = useState<PostalCodeInfo | null>(null);
    const [postalCodeNotFound, setPostalCodeNotFound] = useState(false);

    // Lookups finish after later keystrokes; these keep only the latest one
    // and apply it to the latest address.
    const addressRef = useRef(address);
    const lookingUp = useRef<string | null>(null);

    const update = (patch: Partial<Address>) => {
        const updated = { ...addressRef.current, ...patch };
        addressRef.current = updated;
        setAddress(updated);
        onChange(updated);
    };

    const handleChange = (
        field: keyof Address,
        value: string
    ) => update({ [field]: value });

    // The state always comes from the postal code. City and colonia are only
    // filled when the customer types a new postal code, and stay editable:
    // the catalog is sometimes wrong.
    const lookUpPostalCode = async (code: string, fill: boolean) => {
        lookingUp.current = code;
        setPlace(null);
        setPostalCodeNotFound(false);

        let found: PostalCodeInfo | null = null;
        try {
            found = await getPostalCodeApi(code);
        } catch (err) {
            if ((err as { response?: { status?: number } })?.response?.status === 404) {
                if (lookingUp.current === code) setPostalCodeNotFound(true);
            }
            return;
        }
        if (lookingUp.current !== code) return;

        setPlace(found);
        if (!fill) {
            if (addressRef.current.state !== found.state) update({ state: found.state });
            return;
        }
        update({
            state: found.state,
            city: found.city,
            neighborhood: found.neighborhoods.length === 1 ? found.neighborhoods[0] : "",
        });
    };

    const handlePostalCodeChange = (value: string) => {
        const code = value.replace(/\D/g, "");
        update({ postal_code: code });
        if (isFullPostalCode(code)) {
            lookUpPostalCode(code, true);
        } else {
            lookingUp.current = null;
            setPlace(null);
            setPostalCodeNotFound(false);
        }
    };

    // A saved address being edited: load its colonias without changing what
    // the customer already has.
    useEffect(() => {
        const code = initialAddress?.postal_code ?? "";
        if (isFullPostalCode(code)) lookUpPostalCode(code, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-black/60 p-6 rounded-xl">
            <h2 className="text-xl text-white mb-4">{t.address.title}</h2>

            <div className="grid grid-cols-1 gap-4">

                <input
                    placeholder={t.address.firstName}
                    value={address.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                />

                <input
                    placeholder={t.address.lastName}
                    value={address.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                />

                <input
                    placeholder={t.address.street}
                    value={address.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                />

                <input
                    placeholder={t.address.exteriorNumber}
                    value={address.exterior_number}
                    onChange={(e) => handleChange("exterior_number", e.target.value)}
                />

                <input
                    placeholder={t.address.interiorNumber}
                    value={address.interior_number ?? ""}
                    onChange={(e) => handleChange("interior_number", e.target.value)}
                />

                {/* First, so it can fill in the fields below. */}
                <div>
                    <input
                        placeholder={t.address.postalCode}
                        value={address.postal_code}
                        onChange={(e) => handlePostalCodeChange(e.target.value)}
                        inputMode="numeric"
                        maxLength={5}
                        pattern={POSTAL_CODE_PATTERN}
                        aria-invalid={postalCodeNotFound}
                        className="input w-full"
                    />
                    {postalCodeNotFound && (
                        <p className="mt-1 text-red-300 text-sm">{t.address.postalCodeNotFound}</p>
                    )}
                </div>

                {/* Locked to the postal code's state once it's found. Saved
                    addresses from before the dropdown may hold a free-text
                    state; it shows the placeholder until one is picked. */}
                <select
                    aria-label={t.address.state}
                    value={isMexicanState(address.state) ? address.state : ""}
                    onChange={(e) => handleChange("state", e.target.value)}
                    disabled={place !== null}
                    className="input"
                >
                    <option value="" disabled>{t.address.state}</option>
                    {MEXICAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                <input
                    placeholder={t.address.city}
                    value={address.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="input"
                />

                {/* Free text with the catalog's colonias as suggestions. */}
                <div>
                    <input
                        placeholder={t.address.neighborhood}
                        value={address.neighborhood}
                        onChange={(e) => handleChange("neighborhood", e.target.value)}
                        list="neighborhood-options"
                        autoComplete="off"
                        className="input w-full"
                    />
                    <datalist id="neighborhood-options">
                        {place?.neighborhoods.map((name) => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                    {place && place.neighborhoods.length > 1 && (
                        <p className="mt-1 text-white/60 text-sm">{t.address.neighborhoodHint}</p>
                    )}
                </div>

                <input
                    placeholder={t.address.phone}
                    value={address.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="input"
                />

                <textarea
                    placeholder={t.address.specialInstructions}
                    aria-label={t.address.specialInstructions}
                    value={address.special_instructions ?? ""}
                    onChange={(e) => handleChange("special_instructions", e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="input resize-y"
                />

            </div>
        </div>
    );
}
