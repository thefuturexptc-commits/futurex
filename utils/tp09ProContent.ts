import type { Product } from '../types';
import { getTp09Model, TP09_PRO_DESCRIPTION } from './productOverviews.js';

export const TP09_PRO_FEATURES = [
  "One Fan. Every Season: Cooling airflow for warmer days and warm air for chilly evenings. Switch modes as the weather changes.",
  "Smooth Airflow. Sleek Design: Enjoy bladeless airflow without exposed rotating fan blades, in a clean, modern tower.",
  "Power Behind the Breeze: A BLDC motor running at up to 14,000 RPM keeps the airflow moving.",
  "A Little Warmth Goes a Long Way: Switch to PTC ceramic heating when your space needs warm airflow.",
  "Find Your Perfect Breeze: With 10 speed settings, choose a gentle flow or turn it up to suit your day.",
  "Share the Breeze: Let 180° automatic oscillation sweep airflow across a wider area, rather than one fixed spot.",
  "Stay Comfortable. Stay Seated: Adjust settings with the included remote, right from your sofa, desk or bedside.",
  "Comfort at Your Fingertips: Make quick adjustments directly on the fan with its easy-to-reach touch panel.",
  "Set the Time. Carry On: Choose an operating duration of up to 9 hours with the built-in timer.",
  "Keep Your Space Calm: Low-noise operation brings comfortable airflow to reading time, work sessions and bedroom routines.",
  "An Extra Layer of Protection: A built-in tip-over switch helps shut off the appliance if it tips over.",
  "More Comfort. Less Clutter: A slim tower design fits into modern interiors while keeping your floor space open."
];

export const TP09_PRO_SPECS: Record<string, string> = {
  "Brand": "The FutureX",
  "Model": "TP09 PRO",
  "Product Type": "Bladeless Tower Fan",
  "Operating Modes": "Hot & Cool",
  "Heating Technology": "PTC Ceramic Heating",
  "Motor Type": "BLDC Motor",
  "Motor Speed": "Up to 14,000 RPM",
  "Speed Settings": "10 Levels",
  "Oscillation": "180° Automatic",
  "Air Delivery": "382 CFM (as specified)",
  "Control Type": "Remote & Touch Control",
  "Timer": "Up to 9 Hours",
  "Body Material": "ABS",
  "Design": "Modern Tower Design",
  "Safety Feature": "Tip-Over Switch",
  "Warranty": "1 Year on Motor & Internal Components",
  "Package Contents": "1 x FutureX TP09 PRO Bladeless Tower Fan, 1 x remote control, 1 x user manual, and power cord if supplied separately. Final contents are subject to the supplied product packaging."
};

export const TP09_PRO_FAQS = [
  {
    "q": "Can I use the TP09 PRO throughout the year?",
    "a": "Yes. The appliance offers cooling airflow and a PTC ceramic heating mode for different seasonal comfort requirements."
  },
  {
    "q": "Does the fan have exposed blades?",
    "a": "No. It uses a bladeless tower design without exposed rotating fan blades."
  },
  {
    "q": "Can I control the fan remotely?",
    "a": "Yes. The appliance supports remote control as well as touch-panel operation."
  },
  {
    "q": "How many speed settings are available?",
    "a": "The TP09 PRO offers 10 speed levels."
  },
  {
    "q": "Does the fan oscillate?",
    "a": "Yes. It features 180° automatic oscillation for wider airflow distribution."
  },
  {
    "q": "Does it have a timer?",
    "a": "Yes. It includes a timer function of up to 9 hours."
  },
  {
    "q": "Is it suitable for bedrooms?",
    "a": "It is designed for home and office use, including bedrooms. Its low-noise operation is intended to support comfortable everyday use."
  },
  {
    "q": "How should I clean the fan?",
    "a": "Unplug the appliance, allow it to cool and clean its exterior with a soft cloth. Never pour water into the unit."
  }
];

export const TP09_PRO_DESCRIPTION_HTML = `
<h2>The FutureX TP09 PRO Bladeless Tower Fan</h2>
<p>Enjoy everyday comfort across seasons with the FutureX TP09 PRO. Combining cooling airflow with PTC ceramic heating, this bladeless tower fan brings convenient control and a modern, space-saving design to your home. Choose from 10 airflow speeds, activate 180° automatic oscillation, and set the 9-hour timer to suit your routine. Adjust settings using the touch panel or included remote control, from your sofa, desk or bedside.</p>
`;

export const TP09_PRO_CARE_HTML = `
<h3>How to Use the FutureX TP09 PRO</h3>
<p><strong>Step 1: Placement</strong></p>
<ul><li>Place the fan on a flat, stable and level surface.</li><li>Keep it away from curtains, furniture and other objects that may block airflow.</li><li>Ensure the air inlet and outlet are unobstructed.</li></ul>
<p><strong>Step 2: Power Connection</strong></p>
<ul><li>Connect the power cord to a suitable electrical socket.</li><li>Ensure the power supply matches the voltage specified on the product rating label.</li><li>Switch on the main power supply.</li></ul>
<p><strong>Step 3: Switching On</strong></p>
<ul><li>Use the touch control panel or remote control to switch on the appliance.</li><li>Select the desired operating mode.</li></ul>
<p><strong>Step 4: Select Cooling or Heating Mode</strong></p>
<ul><li>Choose Cool Mode for airflow and room comfort.</li><li>Choose Hot Mode for warm airflow.</li><li>Always follow the operating instructions for changing between heating and cooling modes.</li></ul>
<p><strong>Step 5: Adjust Airflow</strong></p>
<ul><li>Select from the available 10 speed levels.</li><li>Adjust the airflow according to your comfort.</li></ul>
<p><strong>Step 6: Oscillation Function</strong></p>
<ul><li>Activate the oscillation function to distribute airflow across a wider area.</li><li>Switch it off when you prefer airflow in a fixed direction.</li></ul>
<p><strong>Step 7: Timer Function</strong></p>
<ul><li>Use the timer control to set the desired operating duration, up to 9 hours.</li></ul>
<p><strong>Step 8: Switching Off</strong></p>
<ul><li>Turn off the appliance using the control panel or remote.</li><li>Switch off the main power supply and unplug when the appliance is not in use.</li></ul>
<h3>Safety Instructions &amp; Warnings</h3>
<p>Please read all safety instructions carefully before operating the appliance.</p>
<ol><li>Use the appliance only with the electrical voltage specified on its rating label.</li><li>Keep the appliance on a flat, stable and dry surface.</li><li>Do not use the appliance near water, bathtubs, showers or swimming pools.</li><li>Never touch the power plug or appliance with wet hands.</li><li>Do not insert fingers, objects or foreign materials into the air inlet or outlet.</li><li>Keep curtains, paper, fabrics and other combustible materials away from the air outlet, especially when heating mode is active.</li><li>Do not cover the air inlet or outlet during operation.</li><li>Keep children and pets under supervision when the appliance is operating.</li><li>The heating outlet may become hot during operation. Avoid direct contact with the hot air outlet.</li><li>Do not place the appliance directly next to flammable materials or heat-sensitive objects.</li><li>Do not operate the appliance if the power cord, plug or body is damaged.</li><li>Never pull the power cord to disconnect the appliance. Hold the plug instead.</li><li>Do not operate the appliance with an extension cord or overloaded electrical socket unless the electrical arrangement is suitable for its rated power.</li><li>Do not use the appliance in areas where flammable gases, paints or chemicals are stored.</li><li>Always switch off and unplug the appliance before cleaning or maintenance.</li><li>Do not attempt to open, repair or modify the internal electrical components yourself.</li><li>Do not leave the appliance unattended while heating mode is operating.</li><li>If the appliance makes unusual noises, produces a burning smell or shows signs of malfunction, switch it off and disconnect the power immediately.</li></ol>
<p><strong>Important:</strong> This appliance is intended for indoor household use. It is not a substitute for proper room ventilation. Cooling mode circulates air; it does not provide refrigerated cooling like an air conditioner.</p>
<h3>Cleaning &amp; Maintenance</h3>
<p>Regular cleaning helps maintain airflow and supports the long-term performance of the appliance.</p>
<ul><li>Switch off and unplug the appliance before cleaning.</li><li>Allow the heating components to cool completely before handling or cleaning.</li><li>Clean the outer body using a soft, dry or slightly damp cloth.</li><li>Do not pour water directly onto the appliance.</li><li>Keep the air inlet and outlet free from dust and obstructions.</li><li>Do not use abrasive cleaners, harsh chemicals or solvents.</li><li>Never immerse the appliance, power cord or plug in water.</li><li>Ensure the appliance is completely dry before reconnecting it to the power supply.</li><li>For internal servicing, contact an authorised service professional.</li></ul>
`;

export const TP09_PRO_WARRANTY_HTML = `
<h3>Warranty &amp; Customer Support</h3>
<p><strong>Warranty Period:</strong> 1 Year from the date of delivery.</p>
<p><strong>Warranty Coverage:</strong></p>
<ul><li>Motor malfunction under normal operating conditions.</li><li>Internal electrical faults.</li><li>Functional issues arising from covered internal component failures.</li></ul>
<p><strong>Warranty Exclusions:</strong></p>
<ul><li>Physical or accidental damage.</li><li>Damage caused by improper installation or misuse.</li><li>Water or liquid damage.</li><li>Unauthorised repairs or modifications.</li><li>Damage caused by voltage fluctuations or improper electrical supply.</li></ul>
<p><strong>How to Claim Warranty:</strong></p>
<p>To register a warranty claim, contact our support team with the following details:</p>
<ul><li>Order ID or purchase invoice.</li><li>Product name and model.</li><li>Date of delivery.</li><li>Description of the issue.</li><li>Clear product photographs and a short issue video.</li></ul>
<p><strong>Customer Support</strong></p>
<p>Email: thefuturex.ptc@gmail.com Phone: 8530340676</p>
<p><strong>The FutureX – Smart Technology. Everyday Comfort.</strong></p>
`;

export const getTp09Content = (product?: Pick<Product, 'name' | 'slug' | 'specs'> | null) => {
  const model = getTp09Model(product);
  if (!model) return null;
  const label = (value: string) => value.replaceAll('TP09 PRO', model);
  return {
    description: label(TP09_PRO_DESCRIPTION),
    html: label(TP09_PRO_DESCRIPTION_HTML),
    careHtml: label(TP09_PRO_CARE_HTML),
    warrantyHtml: label(TP09_PRO_WARRANTY_HTML),
    features: TP09_PRO_FEATURES,
    highlights: ['Bladeless airflow', 'Hot & cool modes', '10-speed control', '180-degree oscillation', 'Remote & touch control', 'PTC ceramic heating', '9-hour timer', 'Modern tower design'],
    specs: Object.fromEntries(Object.entries(TP09_PRO_SPECS).map(([key, value]) => [key, label(value)])),
    faqs: TP09_PRO_FAQS.map(({ q, a }) => ({ q: label(q), a: label(a) })),
  };
};

export const TP09_PRO_LISTING_TITLE = "The FutureX TP09 PRO Bladeless Hot & Cool Tower Fan with PTC Ceramic Heating, Remote Control, 180° Oscillation & ABS Body";

export const TP09_PRO_LISTING_DESCRIPTION_HTML = `
  <h2>TP09 Pro at a glance</h2>
  <p>Experience year-round comfort with the <strong>FutureX TP09 PRO Bladeless Hot &amp; Cool Tower Fan</strong>, a modern 2-in-1 cooling fan and heater designed for convenient indoor use.</p>
  <p>Combining bladeless airflow technology with PTC ceramic heating, the TP09 PRO offers comfortable air circulation during warmer weather and heated airflow when temperatures drop.</p>
  <p>Featuring <strong>10 adjustable airflow speeds, 180° automatic oscillation, a 9-hour timer, remote control and touch controls</strong>, this tower fan makes it easy to customise your everyday comfort.</p>
  <p>Its contemporary bladeless design and ABS body make it a practical choice for modern bedrooms, living rooms, offices and study spaces.</p>
  <h2>Key Features</h2>
  <ul>
    <li><strong>2-in-1 Hot &amp; Cool Modes</strong> – Cooling airflow and PTC ceramic heating in one appliance.</li>
    <li><strong>Bladeless Airflow Technology</strong> – Modern airflow outlet without exposed conventional fan blades.</li>
    <li><strong>10 Adjustable Airflow Speeds</strong> – Customise cooling airflow intensity to suit your comfort.</li>
    <li><strong>PTC Ceramic Heating</strong> – Integrated heating technology for comfortable warm airflow.</li>
    <li><strong>180° Automatic Oscillation</strong> – Wider airflow distribution across your room.</li>
    <li><strong>9-Hour Timer</strong> – Schedule operation according to your daily routine.</li>
    <li><strong>Remote Control Operation</strong> – Conveniently control fan functions from a distance.</li>
    <li><strong>Touch Control Panel</strong> – Easy access to essential operating functions.</li>
    <li><strong>ABS Body</strong> – Contemporary exterior designed for everyday indoor use.</li>
    <li><strong>Easy Cleaning</strong> – Accessible exterior surfaces and air inlet openings.</li>
    <li><strong>Space-Saving Tower Design</strong> – Modern vertical design suitable for different indoor arrangements.</li>
  </ul>
  <h2>The FutureX TP09 PRO Bladeless Tower Fan</h2>
  <h3>Smart Cooling. Comfortable Heating. One Modern Design.</h3>
  <p>Bring convenience and contemporary comfort into your home with the FutureX TP09 PRO.</p>
  <p>Designed for year-round use, this bladeless hot and cool tower fan combines adjustable cooling airflow and PTC ceramic heating in a single appliance.</p>
  <p>Enjoy refreshing air circulation during warmer months and comfortable heated airflow during colder weather.</p>
  <p>Its modern tower design complements bedrooms, living rooms, offices and other indoor spaces.</p>
  <h2>Hot &amp; Cool Technology</h2>
  <h3>Stay Comfortable Through Every Season.</h3>
  <p>Why choose separate appliances when one fan can provide both cooling airflow and heating?</p>
  <p>The TP09 PRO features two operating modes.</p>
  <p><strong>Cool Mode</strong></p>
  <p>Circulates room-temperature air to create a refreshing breeze.</p>
  <p><strong>Hot Mode</strong></p>
  <p>Uses PTC ceramic heating technology to provide warm airflow.</p>
  <p>Switch between operating modes according to the season and your comfort preferences.</p>
  <p><em>Cooling mode circulates ambient air and does not provide refrigerated cooling like an air conditioner.</em></p>
  <h2>10-Speed Airflow Control</h2>
  <h3>From Gentle Breeze to Stronger Airflow.</h3>
  <p>Choose from 10 airflow speeds to personalise your cooling experience.</p>
  <p>Select a lower setting when you prefer gentle airflow or increase the speed for stronger air circulation.</p>
  <p>Whether you're working, relaxing or spending time indoors, adjustable speed control allows you to choose the airflow intensity that suits your needs.</p>
  <h2>PTC Ceramic Heating</h2>
  <h3>Warm Air When You Need It.</h3>
  <p>The integrated PTC ceramic heating system provides heated airflow during colder weather.</p>
  <p>Air enters through the inlet, passes through the heating system and exits through the bladeless outlet.</p>
  <p>This combination of heating and airflow makes the TP09 PRO a practical appliance for seasonal indoor comfort.</p>
  <h2>180° Automatic Oscillation</h2>
  <h3>Wider Airflow. Greater Flexibility.</h3>
  <p>Enjoy broader airflow distribution with the 180° automatic oscillation function.</p>
  <p>Activate the Sway control to move the airflow across a wider area.</p>
  <p>Turn oscillation off when you prefer more focused airflow.</p>
  <h2>Remote &amp; Touch Control</h2>
  <h3>Everyday Comfort at Your Fingertips.</h3>
  <p>Manage your fan settings using the integrated control panel or supplied remote control.</p>
  <p>The manual illustrates the following remote functions:</p>
  <ul>
    <li>Power On/Off</li>
    <li>Speed Control +</li>
    <li>Speed Control −</li>
    <li>Timer +</li>
    <li>Timer −</li>
    <li>Sway/Cancel</li>
  </ul>
  <h2>9-Hour Timer</h2>
  <h3>Convenient Operation for Your Daily Routine.</h3>
  <p>Set the fan's operating duration using the adjustable timer.</p>
  <p>The TP09 PRO supports timer settings of up to 9 hours, allowing you to customise operation without repeatedly adjusting the appliance.</p>
  <h2>Bladeless Airflow Technology</h2>
  <h3>Modern Design. Smooth Air Circulation.</h3>
  <p>Unlike traditional fans with exposed rotating blades, the TP09 PRO uses an internal motor and a specially shaped bladeless outlet.</p>
  <p>Air is drawn through the inlet openings in the main body and directed through the upper air outlet.</p>
  <p>This produces a continuous airflow stream while maintaining a contemporary appearance.</p>
  <h3>The FutureX TP09 PRO – Bladeless Hot &amp; Cool Tower Fan for Modern Homes</h3>
  <p>The FutureX TP09 PRO Bladeless Tower Fan combines modern airflow technology, convenient controls and integrated PTC ceramic heating in one versatile appliance.</p>
  <p>Designed for indoor comfort, it provides adjustable cooling airflow during warm weather and heated airflow when temperatures fall.</p>
  <h3>Bladeless Design</h3>
  <p>The enclosed airflow outlet creates a contemporary appearance without exposed conventional fan blades.</p>
  <h3>10-Speed Cooling Control</h3>
  <p>Choose from 10 airflow settings to customise air circulation.</p>
  <h3>PTC Ceramic Heating</h3>
  <p>Switch to heating mode for warm airflow during colder weather.</p>
  <h3>180° Oscillation</h3>
  <p>Distribute airflow across a wider area with automatic oscillation.</p>
  <h3>Remote Control Convenience</h3>
  <p>Adjust operating settings without accessing the appliance directly.</p>
  <h3>9-Hour Timer</h3>
  <p>Select the desired operating duration to suit your routine.</p>
  <h3>ABS Body</h3>
  <p>The ABS exterior provides a modern appearance suited to indoor household use.</p>
  <h3>Easy Maintenance</h3>
  <p>Regular exterior cleaning and dust removal from accessible air inlet openings help maintain proper airflow.</p>
  <h2>Product Structure</h2>
  <p>The shared manual identifies the following components.</p>
  <ul>
    <li><strong>Output Channels:</strong> Direct airflow from the bladeless loop</li>
    <li><strong>Outlet Circle:</strong> Main upper airflow outlet</li>
    <li><strong>Main Body:</strong> Houses internal operating components</li>
    <li><strong>Input Channels:</strong> Draw air into the appliance</li>
    <li><strong>View Screen:</strong> Displays operating information</li>
    <li><strong>ON/OFF:</strong> Power control</li>
    <li><strong>Speed Regulation:</strong> Adjusts airflow intensity</li>
    <li><strong>Speed:</strong> Airflow control function</li>
    <li><strong>Timing:</strong> Timer control</li>
  </ul>
  <h2>How to Use the FutureX TP09 PRO</h2>
  <h3>Step 1: Proper Placement</h3>
  <ol>
    <li>Place the appliance on a flat, stable and level surface.</li>
    <li>Keep it away from curtains, furniture and objects that could obstruct airflow.</li>
    <li>Ensure the air inlet and outlet remain unobstructed.</li>
    <li>Position the appliance in a dry indoor location.</li>
  </ol>
  <h3>Step 2: Connect the Power Supply</h3>
  <ol>
    <li>Check the voltage specified on the product rating label.</li>
    <li>Connect the power cord to a suitable electrical socket.</li>
    <li>Ensure your hands and the electrical connection are dry.</li>
    <li>Switch on the power supply.</li>
  </ol>
  <h3>Step 3: Switch On</h3>
  <p>Press the ON/OFF button on the appliance or remote control.</p>
  <p>Select the desired operating mode.</p>
  <h3>Step 4: Cooling Mode</h3>
  <ol>
    <li>Select Cool Mode.</li>
    <li>Adjust airflow using the speed controls.</li>
    <li>Choose from 10 available airflow speeds.</li>
  </ol>
  <h3>Step 5: Heating Mode</h3>
  <ol>
    <li>Select the heating function.</li>
    <li>Choose the available heating setting using the appliance controls.</li>
    <li>Keep the appliance clear of combustible materials.</li>
  </ol>
  <h3>Step 6: Oscillation</h3>
  <p>Press Sway/Cancel to activate automatic oscillation.</p>
  <p>Press again to stop oscillation.</p>
  <h3>Step 7: Timer</h3>
  <p>Use the timer controls to select the desired operating duration.</p>
  <p>The TP09 PRO supports up to 9 hours.</p>
  <h3>Step 8: Switch Off</h3>
  <ol>
    <li>Press ON/OFF.</li>
    <li>Switch off the main power supply.</li>
    <li>Unplug the appliance when not in use.</li>
    <li>Allow heating components to cool before cleaning or handling.</li>
  </ol>
  <h2>Remote Control Operation</h2>
  <ul>
    <li><strong>ON/OFF:</strong> Switches the appliance on or off</li>
    <li><strong>Sway/Cancel:</strong> Activates or stops oscillation</li>
    <li><strong>Speed Control +:</strong> Increases airflow speed</li>
    <li><strong>Speed Control −:</strong> Decreases airflow speed</li>
    <li><strong>Timing +:</strong> Increases timer duration</li>
    <li><strong>Timing −:</strong> Decreases timer duration</li>
  </ul>
  <h3>Remote Battery Replacement</h3>
  <ol>
    <li>Open the battery compartment on the rear of the remote control.</li>
    <li>Remove the used batteries.</li>
    <li>Insert replacement AAA batteries following the polarity markings.</li>
    <li>Close the compartment securely.</li>
  </ol>
  <h2>Airflow Working Principle</h2>
  <p>The manual describes a bladeless airflow mechanism that differs from a conventional exposed-blade fan.</p>
  <ol>
    <li>Air enters through the inlet openings in the main body.</li>
    <li>The internal motor draws air into the appliance.</li>
    <li>Air travels through the internal airflow channels.</li>
    <li>The upper bladeless outlet directs the air outward.</li>
    <li>The shaped outlet helps produce a continuous airflow stream.</li>
  </ol>
  <h2>Cleaning &amp; Maintenance</h2>
  <h3>Exterior Cleaning</h3>
  <ol>
    <li>Switch off the appliance.</li>
    <li>Disconnect the power plug.</li>
    <li>Allow heated components to cool completely.</li>
    <li>Wipe the exterior with a soft, clean cloth.</li>
    <li>Do not use detergents, polishing agents or harsh chemicals.</li>
  </ol>
  <h3>Air Inlet &amp; Outlet Cleaning</h3>
  <ol>
    <li>Disconnect the appliance from the power supply.</li>
    <li>Inspect the air inlet and outlet for dust.</li>
    <li>Use a soft brush to remove accessible dust and debris.</li>
    <li>Keep the ventilation openings clear.</li>
    <li>Do not insert cleaning tools deeply into internal components.</li>
  </ol>
  <h3>Maintenance Precautions</h3>
  <ul>
    <li>Never wash the appliance under running water.</li>
    <li>Do not immerse the fan in water.</li>
    <li>Do not spray liquid into the air outlet.</li>
    <li>Do not use abrasive cleaning products.</li>
    <li>Do not attempt unauthorised internal repairs.</li>
    <li>Ensure the appliance is dry before restarting.</li>
  </ul>
  <h2>Safety Instructions &amp; Warnings</h2>
  <ul>
    <li>Use only the electrical supply specified on the rating label.</li>
    <li>Keep the appliance on a stable and level surface.</li>
    <li>Do not operate near water or in wet environments.</li>
    <li>Never touch the plug with wet hands.</li>
    <li>Keep the air inlet and outlet unobstructed.</li>
    <li>Do not insert fingers or objects into airflow openings.</li>
    <li>Keep children and pets supervised during operation.</li>
    <li>Avoid touching hot surfaces during heating operation.</li>
    <li>Keep combustible materials away from the heating outlet.</li>
    <li>Do not operate the appliance with a damaged power cord or plug.</li>
    <li>Never disconnect the appliance by pulling its cable.</li>
    <li>Avoid overloaded electrical sockets.</li>
    <li>Do not operate near flammable gases or chemicals.</li>
    <li>Switch off and unplug before cleaning.</li>
    <li>Do not attempt to dismantle or modify internal components.</li>
    <li>Do not leave heating operation unattended.</li>
    <li>Stop operation immediately if unusual sounds, smoke or burning smells occur.</li>
    <li>Keep the appliance away from excessive moisture and outdoor weather.</li>
    <li>Allow heated components to cool before handling.</li>
  </ul>
  <p>Cooling mode circulates room-temperature air.</p>
  <h2>Warranty &amp; Support</h2>
  <p><strong>Warranty:</strong> 1-Year Limited Motor Warranty</p>
  <p><strong>Customer Support Email:</strong> <a href="mailto:thefuturex.ptc@gmail.com">thefuturex.ptc@gmail.com</a></p>
  <p><strong>Customer Support Phone:</strong> <a href="tel:+918530340676">8530340676</a></p>
  <p><strong>Shipping:</strong> Free Shipping Across India, subject to serviceability.</p>
  <p><strong>Exchange Review:</strong> 7 Days for Verified Delivery Defects, subject to the applicable policy.</p>
  <h2>Hot and cool airflow for everyday use</h2>
  <h3>The FutureX TP09 PRO – One Fan. Two Seasons. Everyday Comfort.</h3>
  <p>Experience convenient indoor comfort with the FutureX TP09 PRO Bladeless Hot &amp; Cool Tower Fan.</p>
  <p>With <strong>10 adjustable airflow speeds, PTC ceramic heating, 180° oscillation, a 9-hour timer, remote control and a modern ABS body</strong>, the TP09 PRO combines versatile functionality with contemporary design.</p>
  <p><strong>Designed for Summer Breezes. Ready for Winter Warmth.</strong></p>
`;

export const TP09_PRO_LISTING_SPECS = {
  "Brand": "The FutureX",
  "Model": "TP09 PRO",
  "Product Name": "Bladeless Hot & Cool Tower Fan",
  "Product Type": "Tower Fan with Heater",
  "Heating Technology": "PTC Ceramic Heating",
  "Body Material": "ABS",
  "Operating Modes": "Hot & Cool",
  "Application": "Indoor Household & Office Use",
  "Design": "Modern Bladeless Tower",
  "Fan Structure": "Enclosed Airflow Outlet",
  "Main Body": "ABS Exterior",
  "Air Inlet": "Main Body Ventilation Openings",
  "Air Outlet": "Upper Bladeless Loop",
  "Base": "Integrated Tower Base",
  "Cooling Airflow Speeds": "10",
  "Heating": "PTC Ceramic Heating",
  "Oscillation": "180° Automatic",
  "Timer": "Up to 9 Hours",
  "Remote Control": "Yes",
  "Touch Controls": "Yes",
  "Power On/Off": "Supported",
  "Speed Increase/Decrease": "Supported",
  "Timer Increase/Decrease": "Supported",
  "Oscillation Control": "Sway/Cancel",
  "Remote Battery Type": "AAA",
  "Motor Warranty": "1-Year Limited Motor Warranty",
  "Shipping": "Free Shipping Across India",
  "Exchange Review": "7 Days for Verified Delivery Defects",
  "Support Email": "thefuturex.ptc@gmail.com",
  "Support Phone": "8530340676",
};

export const TP09_PRO_LISTING_FAQS = [
  {
    q: "What is the FutureX TP09 PRO Bladeless Tower Fan?",
    a: "The TP09 PRO is a hot and cool bladeless tower fan featuring PTC ceramic heating, adjustable airflow, remote control, oscillation and timer functions.",
  },
  {
    q: "Does the TP09 PRO provide hot and cool air?",
    a: "Yes. It supports natural air circulation and heated airflow.",
  },
  {
    q: "How many cooling speeds are available?",
    a: "The TP09 PRO offers 10 adjustable airflow speeds.",
  },
  {
    q: "Does the fan support automatic oscillation?",
    a: "Yes. The product listing specifies 180° automatic oscillation.",
  },
  {
    q: "Does it have a remote control?",
    a: "Yes. The TP09 PRO includes remote control operation.",
  },
  {
    q: "Does the fan have touch controls?",
    a: "Yes. The product includes an integrated touch control panel.",
  },
  {
    q: "Does the TP09 PRO have a timer?",
    a: "Yes. It supports a timer of up to 9 hours.",
  },
  {
    q: "What heating technology does it use?",
    a: "The TP09 PRO uses PTC ceramic heating technology.",
  },
  {
    q: "Is it suitable for summer?",
    a: "Yes. Cooling mode provides room-temperature airflow.",
  },
  {
    q: "Is it suitable for winter?",
    a: "Yes. The integrated heating function provides warm airflow.",
  },
  {
    q: "Is the TP09 PRO an air conditioner?",
    a: "No. It circulates ambient air without refrigerated cooling.",
  },
  {
    q: "Does it have exposed fan blades?",
    a: "No. The product features a bladeless-style outlet without exposed conventional rotating fan blades.",
  },
  {
    q: "What material is used for the body?",
    a: "The product listing specifies an ABS body.",
  },
  {
    q: "How do I clean the fan?",
    a: "Switch it off, unplug it, allow it to cool and wipe the exterior with a soft cloth. Remove accessible dust using a soft brush.",
  },
  {
    q: "What batteries does the remote require?",
    a: "The shared manual specifies AAA batteries.",
  },
  {
    q: "Can the fan be used in bedrooms?",
    a: "Yes, when installed and operated in a suitable indoor location with the required safety clearances.",
  },
  {
    q: "Is the TP09 PRO suitable for offices?",
    a: "Yes. Its tower design and adjustable airflow make it suitable for appropriate indoor office environments.",
  },
  {
    q: "What is the warranty period?",
    a: "The product listing specifies a 1-year limited motor warranty, subject to the applicable terms.",
  },
  {
    q: "Is shipping available across India?",
    a: "The website lists free shipping across India, subject to delivery availability.",
  },
  {
    q: "Is cash on delivery available?",
    a: "Cash on delivery is available for eligible orders and serviceable locations.",
  },
  {
    q: "What is the exchange policy?",
    a: "The website lists a 7-day exchange review for verified delivery defects, subject to the applicable policy.",
  },
  {
    q: "How do I contact FutureX support?",
    a: "Email thefuturex.ptc@gmail.com or call 8530340676.",
  },
];
