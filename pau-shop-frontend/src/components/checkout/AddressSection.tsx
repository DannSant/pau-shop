import {  useEffect, useState } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
    setAddressConfirmed,
    setSelectedAddress,
} from "../../features/checkout/checkoutSlice";
import AddressForm from "./AddressForm";
import { t } from "../../i18n";
import type { Address } from "../../types/address";
import { createAddress, fetchAddresses, updateAddress } from "../../features/address/addressSlice";

export default function AddressSection() {
    const dispatch = useAppDispatch();

    const { address: selectedAddress } = useAppSelector(
        (state) => state.checkout
    );

    const { addresses } = useAppSelector((state) => state.address);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [saveError, setSaveError] = useState(false);

    // Load addresses
    useEffect(() => {
        dispatch(fetchAddresses());
    }, [dispatch]);

    useEffect(() => {
        dispatch(setAddressConfirmed(confirmed));
    }, [confirmed, dispatch]);

    useEffect(() => {
        if (addresses.length > 0) {
            const oldest = addresses[0];
            setSelectedId(oldest.id!);
            setEditingAddress(oldest);
        }
    }, [addresses]);

    // Handle selecting existing address
    const handleSelect = (addr: Address) => {
        setSelectedId(addr.id!);
        //setEditingAddress(addr);
        //setShowForm(true);
        setConfirmed(false);
    };

    // Handle editing selected address
    const handleEdit = () => {
        const addr = addresses.find((a) => a.id === selectedId);
        if (!addr) {
            console.error("Selected address not found");
            return;
        }
        setEditingAddress(addr);
        setShowForm(true);
    }

    // Confirm selected/edited address
    const handleConfirm = async () => {
        if (!editingAddress) {
            setSaveError(true);
            return;
        }

        setSaveError(false);
        try {
            const saved = editingAddress.id
                ? await dispatch(updateAddress(editingAddress)).unwrap()
                : await dispatch(createAddress(editingAddress)).unwrap();

            setSelectedId(saved.id!);
            setEditingAddress(saved);
            setShowForm(false);
            setConfirmed(true);
            dispatch(setSelectedAddress(saved));
        } catch (err) {
            console.error("Failed to save address", err);
            setSaveError(true);
        }
    };

    const handleSelectAddress = () => {
         const addr = addresses.find((a) => a.id === selectedId);
        if (!addr) {
            console.error("Selected address not found");
            return;
        }
        setShowForm(false);
        setConfirmed(true);
        dispatch(setSelectedAddress(addr));
    }

    // Add new address
    const handleAddNew = () => {
        setEditingAddress(null);
        setSelectedId(null);
        setShowForm(true);
        setConfirmed(false);
    };

    const handleShowAddressList = () => {
        setShowForm(false);
        setConfirmed(false);
    }

    const handleCancel = () => {
        setShowForm(false);
        setSaveError(false);
        setEditingAddress(null);
        if (addresses.length > 0) {
            const oldest = addresses[0];
            setSelectedId(oldest.id!);
            setEditingAddress(oldest);
        }
    }

    return (
        <div className="space-y-6">
            {/* CONFIRMED ADDRESS */}
            {confirmed && selectedAddress && !showForm && (
                <div className="border border-purple-500 bg-purple-500/10 p-4 rounded-xl">
                    <p className="font-semibold">
                        {selectedAddress.first_name} {selectedAddress.last_name}
                    </p>

                    <p>
                        {selectedAddress.street} {selectedAddress.exterior_number}{" "}
                        {selectedAddress.interior_number ?? ""}
                    </p>

                    <p>
                        {selectedAddress.neighborhood}, {selectedAddress.city},{" "}
                        {selectedAddress.state}
                    </p>

                    <p>{selectedAddress.postal_code}</p>

                    {selectedAddress.special_instructions && (
                        <p className="mt-2 text-sm opacity-80 whitespace-pre-line">
                            {selectedAddress.special_instructions}
                        </p>
                    )}

                    <button
                        onClick={handleShowAddressList}
                        className="border border-white/20 px-4 py-2 rounded-lg cursor-pointer"
                    >
                        {t.address.useAnother}
                    </button>
                </div>

            )}

            {/* ADDRESS LIST */}
            {!confirmed && (
                <>
                    <div className="grid gap-4">
                        {addresses.map((addr) => (
                            <div
                                key={addr.id}
                                onClick={() => handleSelect(addr)}
                                className={`p-4 rounded-xl border cursor-pointer transition ${selectedId === addr.id
                                    ? "border-purple-500 bg-purple-500/20"
                                    : "border-white/20"
                                    }`}
                            >
                                <p className="font-semibold">
                                    {addr.first_name} {addr.last_name}
                                </p>

                                <p className="text-sm opacity-80">
                                    {addr.street} {addr.exterior_number}
                                </p>

                                <p className="text-sm opacity-80">
                                    {addr.city}, {addr.state}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ADDRESS BUTTONS */}
                    {!showForm && (
                        <>
                            <button
                                onClick={handleAddNew}
                                className="border border-white/20 px-4 py-2 rounded-lg cursor-pointer"
                            >
                                {t.address.addNew}
                            </button>

                            <button
                                onClick={handleEdit}
                                className="border border-white/20 px-4 py-2 rounded-lg cursor-pointer"
                            >
                                {t.address.edit}
                            </button>
                            <button
                                onClick={handleSelectAddress}
                                className="border border-white/20 px-4 py-2 rounded-lg cursor-pointer"
                            >
                                {t.address.useThis}
                            </button>
                        </>
                    )}
                </>
            )}

            {/* FORM */}
            {showForm && (
                <div className="bg-white/10 p-6 rounded-xl">
                    <AddressForm
                        initialAddress={editingAddress ?? undefined}
                        onChange={(addr) => setEditingAddress(addr)}
                    />

                    {saveError && (
                        <p role="alert" className="mt-4 text-red-300 text-sm">
                            {t.address.saveError}
                        </p>
                    )}

                    <button
                        onClick={handleConfirm}
                        className="mt-4 bg-purple-600 px-6 py-2 rounded-lg cursor-pointer"
                    >
                        {t.address.useThis}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="mt-4 bg-red-600 px-6 py-2 rounded-lg cursor-pointer"
                    >
                        {t.address.cancel}
                    </button>

                </div>
            )}
        </div>
    );
}