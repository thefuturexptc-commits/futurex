import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const productTypes = ['Smart Band', 'Smart Ring', 'Bladeless Fan', 'Smart Monitoring', 'Smart Glasses', 'Accessories'];
const modelsByType: Record<string, string[]> = {
  'Smart Band': ['TFX Vital V5', 'Premium Smart Band'],
  'Smart Ring': ['TFX Display Pro Smart Ring', 'Smart Ring'],
  'Bladeless Fan': ['TP-09 Pro', 'Q8 Pro', 'Tower Fan'],
  'Smart Monitoring': ['TheFutureX Smart Sleep Tracking Monitoring System'],
  'Smart Glasses': ['Smart Glasses'],
  Accessories: ['Power Essential', 'Other Accessory'],
};
const purchaseChannels = ['TheFutureX Website', 'Amazon', 'Flipkart', 'Retail Store', 'Corporate Order', 'Gift', 'Other'];
const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const WarrantyRegistration: React.FC = () => {
  const location = useLocation();
  const [productType, setProductType] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const orderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('orderId') || '';
  }, [location.search]);

  const selectedProductName = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('product') || '';
  }, [location.search]);

  const modelOptions = useMemo(() => {
    if (!productType) return [];
    return modelsByType[productType] || [];
  }, [productType]);

  return (
    <div className="warranty-page tfx-standard-page min-h-screen bg-[#f3f8fb] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="warranty-page__hero">
          <p>Register Your TheFutureX Product Warranty</p>
          <h1>Register Your TheFutureX Product</h1>
          <span>Register eligible products for faster warranty verification and claim support.</span>
        </div>

        <form
          className="warranty-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          {submitted && (
            <div className="warranty-form__success" role="status">
              Your warranty registration structure is ready. Backend saving can be connected next.
            </div>
          )}

          <div className="warranty-form__grid">
            {orderId && (
              <label className="warranty-form__wide">
                <span>Order ID</span>
                <input type="text" value={orderId} readOnly />
              </label>
            )}

            {selectedProductName && (
              <label className="warranty-form__wide">
                <span>Product selected</span>
                <input type="text" value={selectedProductName} readOnly />
              </label>
            )}

            <label>
              <span>Full Name*</span>
              <input required type="text" placeholder="Type here" />
            </label>

            <label>
              <span>Mobile Number*</span>
              <div className="warranty-form__phone">
                <strong>+91</strong>
                <input required type="tel" inputMode="numeric" placeholder="Type here" />
              </div>
            </label>

            <label className="warranty-form__wide">
              <span>Your Email Address*</span>
              <input required type="email" placeholder="Type here" />
            </label>

            <label>
              <span>Please select the product type*</span>
              <select required value={productType} onChange={(event) => setProductType(event.target.value)}>
                <option value="">Select Type</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Please select the model*</span>
              <select required disabled={!productType}>
                <option value="">Select Model</option>
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>

            <label className="warranty-form__check">
              <input type="checkbox" />
              <span>This was a gift to me</span>
            </label>

            <label>
              <span>Where did you purchase your product?*</span>
              <select required>
                <option value="">Select Channel</option>
                {purchaseChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Please select the date of purchase*</span>
              <input required type="date" />
            </label>

            <label className="warranty-form__wide">
              <span>Please upload your purchase invoice</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            </label>

            <label>
              <span>State*</span>
              <select required>
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>City*</span>
              <input required type="text" placeholder="City" />
            </label>

            <label>
              <span>Pincode*</span>
              <input required type="text" inputMode="numeric" maxLength={6} placeholder="Enter your pincode" />
            </label>
          </div>

          <Button type="submit" className="warranty-form__submit">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};
