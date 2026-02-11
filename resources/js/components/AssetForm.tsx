import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { translations } from '@/utils/translations/asset/asset';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function AssetForm({
                                      data,
                                      setData,
                                      errors,
                                      categories,
                                      subcategories,
                                      departments,
                                      rooms,
                                      users,
                                      purchaseOrders = [],
                                      lang = 'kh',
                                  }: any) {
    const l = lang as 'en' | 'kh';
    const trans = translations[l] ?? translations.en;

    /* ────────────────────────────── MEMOIZED OPTIONS ────────────────────────────── */
    const categoryOptions = useMemo(
        () => categories.map((c: any) => ({ value: String(c.id), label: c.name })),
        [categories]
    );

    const subcategoryOptions = useMemo(
        () => subcategories.map((s: any) => ({ value: String(s.id), label: s.name })),
        [subcategories]
    );

    const departmentOptions = useMemo(
        () => departments.map((d: any) => ({ value: String(d.id), label: d.name })),
        [departments]
    );

    const roomOptions = useMemo(
        () => rooms.map((r: any) => ({ value: String(r.id), label: r.name })),
        [rooms]
    );

    const userOptions = useMemo(
        () => users.map((u: any) => ({ value: String(u.id), label: u.name })),
        [users]
    );

    /* ──────────────────────── PURCHASE ORDER AUTO-FILL ──────────────────────── */
    useEffect(() => {
        if (data.purchase_order_id) {
            const po = purchaseOrders.find((p: any) => p.id === Number(data.purchase_order_id));
            if (po?.total_cost && !data.cost) {
                setData('cost', po.total_cost.toString());
            }
        }
    }, [data.purchase_order_id, purchaseOrders, data.cost, setData]);

    /* ───────────────────────────────── IMAGE LOGIC ───────────────────────────────── */
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleImageChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setData('image', file);
        }
    };

    const removeImage = () => {
        setData('image', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openFilePicker = () => fileInputRef.current?.click();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageChange(file);
    };

    // Clean up object URL when a new file is selected or component unmounts
    useEffect(() => {
        return () => {
            if (data.image && typeof data.image !== 'string') {
                URL.revokeObjectURL(data.image as any);
            }
        };
    }, [data.image]);

    /* ────────────────────────────────── RENDER ────────────────────────────────── */
    return (
        <>
            {/* ──────── BASIC INFO ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-2">
                        {trans.assetTagLabel} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        className={"w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border"}
                        placeholder={trans.assetTagPlaceholder}
                        value={data.asset_tag || ''}
                        onChange={(e) => setData('asset_tag', e.target.value)}
                    />
                    {errors.asset_tag && <p className="text-sm text-red-500">{errors.asset_tag}</p>}
                </div>

                <div>
                    <Label className="mb-2">
                        {trans.assetNameLabel} <span className="text-red-500">*</span>
                    </Label>
                    <Input placeholder={trans.assetNamePlaceholder} value={data.name || ''} onChange={(e) => setData('name', e.target.value)}
                           className={"w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border"}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
            </div>
            {/* ──────── CATEGORY / SUBCATEGORY ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-2">
                        {trans.categoryLabel} <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                        value={data.asset_category_id || ''}
                        onValueChange={(v) => {
                            setData({
                                ...data,
                                asset_category_id: v,
                                asset_subcategory_id: '',
                            });
                        }}
                        options={categoryOptions}
                        placeholder={trans.categoryPlaceholder}
                    />
                </div>

                <div>
                    <Label className="mb-2">{trans.subcategoryLabel}</Label>
                    <SearchableSelect
                        value={data.asset_subcategory_id || ''}
                        onValueChange={(v) => setData('asset_subcategory_id', v || null)}
                        options={subcategoryOptions}
                        placeholder={trans.subcategoryPlaceholder}
                        emptyPlaceholder={data.asset_category_id ? trans.noSubcategories : trans.selectCategoryFirst}
                    />
                </div>
            </div>
            {/* ──────── SERIAL / MODEL ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-2">{trans.serialNumberLabel}</Label>
                    <Input
                        placeholder={trans.serialNumberPlaceholder}
                        value={data.serial_number || ''}
                        onChange={(e) => setData('serial_number', e.target.value)}
                    />
                </div>

                <div>
                    <Label className="mb-2">{trans.modelLabel}</Label>
                    <Input placeholder={trans.modelPlaceholder} value={data.model || ''} onChange={(e) => setData('model', e.target.value)} />
                </div>
            </div>
            {/* ──────── PURCHASE ORDER ──────── */}
            <div>
                <Label className="mb-2">{trans.purchaseOrderLabel}</Label>
                <SearchableSelect
                    value={data.purchase_order_id || ''}
                    onValueChange={(v) => {
                        setData('purchase_order_id', v || null);
                        const po = purchaseOrders.find((p: any) => p.id === Number(v));
                        if (po?.total_cost) setData('cost', po.total_cost.toString());
                    }}
                    options={purchaseOrders.map((po: any) => ({
                        value: String(po.id),
                        label: `${po.po_number}${po.supplier ? ` — ${po.supplier.name}` : ''}`,
                    }))}
                    placeholder={trans.purchaseOrderPlaceholder}
                    emptyPlaceholder={trans.noPOs}
                />
                {errors.purchase_order_id && <p className="text-sm text-red-500 mt-1">{errors.purchase_order_id}</p>}
            </div>
            {/* ──────── DATES ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className={'mb-2'}>
                        {trans.purchaseDateLabel} <span className="text-red-500">*</span>
                    </Label>
                    <Input type="date" value={data.purchase_date || ''} onChange={(e) => setData('purchase_date', e.target.value)} />
                </div>

                <div>
                    <Label className={'mb-2'}>{trans.warrantyUntilLabel}</Label>
                    <Input type="date" value={data.warranty_until || ''} onChange={(e) => setData('warranty_until', e.target.value)} />
                </div>
            </div>
            {/* ──────── COST ──────── */}
            <div>
                <Label className="mb-2">
                    {trans.costLabel} <span className="text-red-500">*</span>
                </Label>
                <Input
                    type="number"
                    step="0.01"
                    placeholder={trans.costPlaceholder}
                    value={data.cost || ''}
                    onChange={(e) => setData('cost', e.target.value)}
                />
            </div>
            {/* ──────── CONDITION / STATUS ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-2">{trans.conditionLabel}</Label>
                    <Select value={data.condition || ''} onValueChange={(v) => setData('condition', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder={trans.conditionPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">{trans.conditionNew}</SelectItem>
                            <SelectItem value="secondhand">{trans.conditionSecondhand}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="mb-2">{trans.statusLabel}</Label>
                    <Select value={data.status || ''} onValueChange={(v) => setData('status', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder={trans.statusPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="available">{trans.statusAvailable}</SelectItem>
                            <SelectItem value="allocated">{trans.statusAllocated}</SelectItem>
                            <SelectItem value="maintenance">{trans.statusMaintenance}</SelectItem>
                            <SelectItem value="disposed">{trans.statusDisposed}</SelectItem>
                            <SelectItem value="lost">{trans.statusLost}</SelectItem>
                            <SelectItem value="damaged">{trans.statusDamaged}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* ──────── DEPARTMENT / ROOM ──────── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-2">{trans.departmentLabel}</Label>
                    <SearchableSelect
                        value={data.current_department_id || ''}
                        onValueChange={(v) => setData('current_department_id', v || null)}
                        options={departmentOptions}
                        placeholder={trans.departmentPlaceholder}
                    />
                </div>

                <div>
                    <Label className="mb-2">{trans.roomLabel}</Label>
                    <SearchableSelect
                        value={data.current_room_id || ''}
                        onValueChange={(v) => setData('current_room_id', v || null)}
                        options={roomOptions}
                        placeholder={trans.roomPlaceholder}
                    />
                </div>
            </div>

            {/* ──────── CUSTODIAN ──────── */}
            <div>
                <Label className="mb-2">{trans.custodianLabel}</Label>
                <SearchableSelect
                    value={data.custodian_user_id || ''}
                    onValueChange={(v) => setData('custodian_user_id', v || null)}
                    options={userOptions}
                    placeholder={trans.custodianPlaceholder}
                />
            </div>
            {/* ──────── NOTES ──────── */}
            <div>
                <Label className="mb-2">{trans.notesLabel}</Label>
                <Textarea placeholder={trans.notesPlaceholder} value={data.notes || ''} onChange={(e) => setData('notes', e.target.value)} rows={4} />
            </div>
            {/* ──────────────────────── IMAGE UPLOAD (NEW) ──────────────────────── */}
            <div className="space-y-3">
                <Label className={'mb-2'} htmlFor="image-upload">
                    {trans.imageLabel}
                </Label>

                {/* Hidden native input */}
                <input
                    ref={fileInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                />

                {/* ──────── PREVIEW OR DROP ZONE ──────── */}
                {data.image ? (
                    <div className="group relative inline-block">
                        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-transparent transition-all group-hover:border-blue-300">
                            <img
                                src={typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image)}
                                alt="Asset preview"
                                className="h-64 w-64 cursor-pointer rounded-lg object-cover shadow-md transition-transform group-hover:scale-[1.02]"
                                onClick={openFilePicker}
                            />

                            {/* Hover overlay */}
                            <div className="bg-opacity-0 group-hover:bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-lg bg-black opacity-0 transition-all group-hover:opacity-100">
                                <p className="flex items-center gap-1 text-sm font-medium text-white">
                                    <ImageIcon className="h-4 w-4" />
                                    {trans.changeImage}
                                </p>
                            </div>

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage();
                                }}
                                className="absolute top-3 right-3 rounded-full bg-red-500 p-2 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none"
                                aria-label={trans.removeImage}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* File name + size (only for new files) */}
                        {typeof data.image !== 'string' && (
                            <p className="mt-2 max-w-xs truncate text-center text-xs text-gray-600">
                                {data.image.name} ({(data.image.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                ) : (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={openFilePicker}
                        className={`relative mx-auto flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${dragActive ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'} ${errors.image ? 'border-red-400 bg-red-50' : ''} `}
                    >
                        <Upload className={`mb-3 h-10 w-10 transition-colors ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <p className="text-sm font-medium text-gray-700">{dragActive ? trans.dropHere : trans.uploadImage}</p>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5 MB</p>
                        <span className="sr-only">Upload image</span>
                    </div>
                )}

                {/* Validation error */}
                {errors.image && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        {errors.image}
                    </p>
                )}
            </div>
            {/* ──────────────────────────────────────────────────────────────────────── */}
        </>
    );
}
