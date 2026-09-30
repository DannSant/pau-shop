import { useState } from "react";
import { type Address } from "../../types/address";
import { t } from "../../i18n";

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
    });

    const handleChange = (
        field: keyof Address,
        value: string
    ) => {
        const updated = { ...address, [field]: value };
        setAddress(updated);
        onChange(updated);
    };

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

                <input
                    placeholder={t.address.city}
                    value={address.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="input"
                />

                <input
                    placeholder={t.address.state}
                    value={address.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="input"
                />

                <input
                    placeholder={t.address.neighborhood}
                    value={address.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    className="input"
                />

                <input
                    placeholder={t.address.postalCode}
                    value={address.postal_code}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                    className="input"
                />


                <input
                    placeholder={t.address.phone}
                    value={address.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="input"
                />

            </div>
        </div>
    );
}