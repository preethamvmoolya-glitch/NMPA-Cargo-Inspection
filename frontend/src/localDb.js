// standalone localStorage database wrapper and mock fetch interceptor
// This allows the entire project to run serverless in the browser, storing IGM data, complaints, and user accounts.

const DEFAULT_USERS = [
  {
    id: 1,
    username: "Admin99",
    password: "Admin@123",
    email: "admin99@nmpa.gov",
    role: "system_admin",
    is_approved: true,
    two_fa_enabled: true,
    last_login: null
  },
  {
    id: 2,
    username: "Auth99",
    password: "Auth@123",
    email: "auth99@nmpa.gov",
    role: "port_authority",
    is_approved: true,
    two_fa_enabled: true,
    last_login: null
  },
  {
    id: 3,
    username: "Inspector99",
    password: "Insp@123",
    email: "inspector99@nmpa.gov",
    role: "inspector",
    is_approved: true,
    two_fa_enabled: true,
    last_login: null
  }
];

const DEFAULT_INSPECTIONS = [
  {
    id: 1,
    bill_of_lading: "BOL-PET-9021",
    origin_port: "Iran",
    cargo_type: "Crude Petroleum (UN 1267 Flammable)",
    weight: 18500,
    image_url: "",
    risk_level: "CRITICAL RISK",
    status: "Awaiting Physical Inspection",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "CRITICAL RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "PETROLEUM [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (PETROLEUM) (High weight: 18,500 MT)"
    }),
    vessel_imo: "9182736",
    vessel_name: "M.T. Sovereign",
    country_of_origin: "Iran",
    gross_tonnage: 18500,
    rms_risk_level: "CRITICAL RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "PETROLEUM [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (PETROLEUM) (High weight: 18,500 MT)"
    }),
    actual_weight: null,
    seal_intact: null,
    structural_damage: null,
    qr_token: null,
    date: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    bill_of_lading: "BOL-CAS-5512",
    origin_port: "Vietnam",
    cargo_type: "Cashew Nuts (Raw Agricultural)",
    weight: 8500,
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80",
    risk_level: "ELEVATED RISK",
    status: "Inspected - Awaiting Authority Adjudication",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "ELEVATED RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "ELEVATED RISK",
      confidence_score: 0.85,
      primary_trigger: "CASHEW [2x2=4]",
      inspection_focus: "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity. | Origin: Medium (Standard maritime security profile) | Impact: Level 2 - Standard/perishable commodity (CASHEW) (Med weight: 8,500 MT)"
    }),
    vessel_imo: "9203847",
    vessel_name: "Cashew Queen",
    country_of_origin: "Vietnam",
    gross_tonnage: 8500,
    rms_risk_level: "ELEVATED RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "ELEVATED RISK",
      confidence_score: 0.85,
      primary_trigger: "CASHEW [2x2=4]",
      inspection_focus: "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity. | Origin: Medium (Standard maritime security profile) | Impact: Level 2 - Standard/perishable commodity (CASHEW) (Med weight: 8,500 MT)"
    }),
    actual_weight: 8512.5,
    seal_intact: true,
    structural_damage: false,
    qr_token: null,
    notes: "Customs seal checked. Cashew quality certification attached. Weight within tolerance (+0.14%).",
    date: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 3,
    bill_of_lading: "BOL-TEX-1039",
    origin_port: "Singapore",
    cargo_type: "Cotton Textiles & Garments",
    weight: 3200,
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80",
    risk_level: "ROUTINE RISK",
    status: "Port Clearance Granted",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "ROUTINE RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "ROUTINE RISK",
      confidence_score: 0.90,
      primary_trigger: "TEXTILES [1x1=1]",
      inspection_focus: "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning. | Origin: Low (Origin is verified pre-approved safe partner) | Impact: Level 1 - Routine dry commodity (TEXTILES)"
    }),
    vessel_imo: "9312984",
    vessel_name: "Silk Road Express",
    country_of_origin: "Singapore",
    gross_tonnage: 3200,
    rms_risk_level: "ROUTINE RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "ROUTINE RISK",
      confidence_score: 0.90,
      primary_trigger: "TEXTILES [1x1=1]",
      inspection_focus: "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning. | Origin: Low (Origin is verified pre-approved safe partner) | Impact: Level 1 - Routine dry commodity (TEXTILES)"
    }),
    actual_weight: 3200.0,
    seal_intact: true,
    structural_damage: false,
    qr_token: "NMPA-PCC-676b92a3f91-10298",
    notes: "Verified at weighbridge #2. Barcode scanner completed validation. Authority cleared for unloading.",
    date: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 4,
    bill_of_lading: "BOL-SUL-4028",
    origin_port: "Somalia",
    cargo_type: "Granular Sulfur (Hazardous Class 4)",
    weight: 16000,
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80",
    risk_level: "CRITICAL RISK",
    status: "Clearance Denied - Detained for Physical Audit",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "CRITICAL RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "SULFUR [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (SULFUR) (High weight: 16,000 MT)"
    }),
    vessel_imo: "9048372",
    vessel_name: "Volcano Trader",
    country_of_origin: "Somalia",
    gross_tonnage: 16000,
    rms_risk_level: "CRITICAL RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "SULFUR [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (SULFUR) (High weight: 16,000 MT)"
    }),
    actual_weight: 16010,
    seal_intact: true,
    structural_damage: true,
    qr_token: null,
    notes: "Container wall shows slight structural degradation. Detained in hazardous cargo bay B3 pending chemical sampling.",
    date: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 5,
    bill_of_lading: "BOL-COF-6677",
    origin_port: "Brazil",
    cargo_type: "Arabica Coffee Beans",
    weight: 9000,
    image_url: "",
    risk_level: "ELEVATED RISK",
    status: "Awaiting Physical Inspection",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "ELEVATED RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "ELEVATED RISK",
      confidence_score: 0.85,
      primary_trigger: "COFFEE [2x2=4]",
      inspection_focus: "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity. | Origin: Medium (Standard maritime security profile) | Impact: Level 2 - Standard/perishable commodity (COFFEE) (Med weight: 9,000 MT)"
    }),
    vessel_imo: "9174829",
    vessel_name: "Arabica Carrier",
    country_of_origin: "Brazil",
    gross_tonnage: 9000,
    rms_risk_level: "ELEVATED RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "ELEVATED RISK",
      confidence_score: 0.85,
      primary_trigger: "COFFEE [2x2=4]",
      inspection_focus: "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity. | Origin: Medium (Standard maritime security profile) | Impact: Level 2 - Standard/perishable commodity (COFFEE) (Med weight: 9,000 MT)"
    }),
    actual_weight: null,
    seal_intact: null,
    structural_damage: null,
    qr_token: null,
    date: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 6,
    bill_of_lading: "BOL-CER-1122",
    origin_port: "Japan",
    cargo_type: "Porcelain Tiles & Decorative Ceramics",
    weight: 4500,
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80",
    risk_level: "ROUTINE RISK",
    status: "Approved",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "ROUTINE RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "ROUTINE RISK",
      confidence_score: 0.90,
      primary_trigger: "CERAMICS [1x1=1]",
      inspection_focus: "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning. | Origin: Low (Origin is verified pre-approved safe partner) | Impact: Level 1 - Routine dry commodity (CERAMICS)"
    }),
    vessel_imo: "9283746",
    vessel_name: "Claymore Liner",
    country_of_origin: "Japan",
    gross_tonnage: 4500,
    rms_risk_level: "ROUTINE RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "ROUTINE RISK",
      confidence_score: 0.90,
      primary_trigger: "CERAMICS [1x1=1]",
      inspection_focus: "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning. | Origin: Low (Origin is verified pre-approved safe partner) | Impact: Level 1 - Routine dry commodity (CERAMICS)"
    }),
    actual_weight: 4498.2,
    seal_intact: true,
    structural_damage: false,
    qr_token: "NMPA-PCC-CER-198273",
    notes: "Routine inspection passed. Clean bill of health. Custom clearance approved.",
    date: new Date(Date.now() - 3600000 * 30).toISOString()
  },
  {
    id: 7,
    bill_of_lading: "BOL-METH-3310",
    origin_port: "Venezuela",
    cargo_type: "Liquid Methanol (Hazardous UN 1230)",
    weight: 22000,
    image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80",
    risk_level: "CRITICAL RISK",
    status: "Inspected - Awaiting Authority Adjudication",
    inspector_email: "inspector99@nmpa.gov",
    assigned_risk_level: "CRITICAL RISK",
    inspection_summary: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "METHANOL [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (METHANOL) (High weight: 22,000 MT)"
    }),
    vessel_imo: "9247384",
    vessel_name: "M.T. Nebula",
    country_of_origin: "Venezuela",
    gross_tonnage: 22000,
    rms_risk_level: "CRITICAL RISK",
    rms_analysis_memo: JSON.stringify({
      risk_rating: "CRITICAL RISK",
      confidence_score: 0.95,
      primary_trigger: "METHANOL [3x3=9]",
      inspection_focus: "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification. | Origin: High (Origin matches high-risk/sanctioned database) | Impact: Level 3 - High-hazard commodity (METHANOL) (High weight: 22,000 MT)"
    }),
    actual_weight: 21995,
    seal_intact: true,
    structural_damage: false,
    qr_token: null,
    notes: "Pressure valve integrity checked. Chemical compliance sheet uploaded. Waiting authority sign-off.",
    date: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const DEFAULT_LOGS = [
  {
    id: 1,
    action: "Register Manifest",
    role: "inspector",
    details: "Registered new General Cargo manifest for Vessel M.T. Sovereign (B/L: BOL-PET-9021).",
    date: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    action: "Inspect Cargo",
    role: "inspector",
    details: "Physical inspection recorded for Cashew Queen (B/L: BOL-CAS-5512). Seal intact.",
    date: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 3,
    action: "Review Adjudication",
    role: "port_authority",
    details: "Port Clearance Granted for Silk Road Express (B/L: BOL-TEX-1039). PCC Certificate generated.",
    date: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 4,
    action: "Escalate Complaint",
    role: "System",
    details: "Escalated security alert from auth99@nmpa.gov directly to Chairman Office Inbox.",
    date: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 5,
    action: "User Login",
    role: "system_admin",
    details: "User Admin99 logged in successfully from station terminal ADMIN-4.",
    date: new Date(Date.now() - 600000).toISOString()
  }
];

const DEFAULT_COMPLAINTS = [
  {
    id: 1,
    email: "inspector99@nmpa.gov",
    subject: "Weighbridge Calibration Variance",
    message: "Weighbridge #3 is showing a deviation of +5kg per Metric Ton compared to weighbridge #1. Needs urgent maintenance recalibration.",
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    is_escalated_to_chairman: false,
    severity_level: "Medium"
  }
];

const DEFAULT_CHAIRMAN_COMPLAINTS = [
  {
    id: 1,
    email: "auth99@nmpa.gov",
    category: "Unregistered Vessel In Anchorage Area",
    description: "An unregistered merchant ship (without transponding AIS signals) was observed waiting outside the harbor limits. Local Port Security and Coast Guard have been alerted.",
    severity_level: "High",
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    is_escalated_to_chairman: true
  }
];

// AI RMS Assess logic in JS
function aiRmsAssess(commodityDesc, countryOfOrigin, grossTonnage) {
  const ctLower = (commodityDesc || "").toLowerCase();
  const coLower = (countryOfOrigin || "").toLowerCase();
  const weight = parseFloat(grossTonnage) || 0;

  // 1. Determine Likelihood based on Country of Origin
  const safeCountries = [
    "singapore", "japan", "germany", "united kingdom", "uk", "united states", "usa", 
    "canada", "australia", "united arab emirates", "uae", "france", "netherlands"
  ];
  const highRiskCountries = [
    "sanctioned", "unknown", "high-risk", "north korea", "iran", "syria", 
    "somalia", "yemen", "venezuela", "libya"
  ];

  const isSafe = safeCountries.some(sc => coLower.includes(sc));
  const isHigh = highRiskCountries.some(hc => coLower.includes(hc));

  let likelihood = 2;
  let likelihoodDesc = "Medium (Standard maritime security profile)";

  if (isHigh || !coLower.strip?.() && !coLower.trim?.()) {
    likelihood = 3;
    likelihoodDesc = "High (Origin matches high-risk/sanctioned database)";
  } else if (isSafe) {
    likelihood = 1;
    likelihoodDesc = "Low (Origin is verified pre-approved safe partner)";
  }

  // 2. Determine Consequence/Severity based on Cargo Commodity Type & Tonnage
  const criticalKeywords = [
    "petroleum", "crude", "oil", "chemical", "acid", "gas", 
    "flammable", "explosive", "fertilizer", "sulfur", "methanol", "coal", "iron ore", "hazardous",
    "lng", "liquefied natural gas"
  ];
  const elevatedKeywords = [
    "timber", "cashew", "coffee", "cocoa", "electronics", "almond", "pharmaceutical",
    "machinery", "copper", "scrap metal", "silk", "spice", "tobacco"
  ];
  const routineKeywords = [
    "textiles", "garments", "toys", "ceramics", "glassware", 
    "paper", "plastic goods", "furniture", "footwear", "tiles"
  ];

  const foundCritical = criticalKeywords.find(k => ctLower.includes(k));
  const foundElevated = elevatedKeywords.find(k => ctLower.includes(k));
  const foundRoutine = routineKeywords.find(k => ctLower.includes(k));

  let baseConsequence = 1;
  let consequenceReason = "Default routine cargo classification";
  let commodityTrigger = "GENERAL CARGO";

  if (foundCritical) {
    baseConsequence = 3;
    consequenceReason = `High-hazard commodity (${foundCritical.toUpperCase()})`;
    commodityTrigger = foundCritical.toUpperCase();
  } else if (foundElevated) {
    baseConsequence = 2;
    consequenceReason = `Standard/perishable commodity (${foundElevated.toUpperCase()})`;
    commodityTrigger = foundElevated.toUpperCase();
  } else if (foundRoutine) {
    baseConsequence = 1;
    consequenceReason = `Routine dry commodity (${foundRoutine.toUpperCase()})`;
    commodityTrigger = foundRoutine.toUpperCase();
  }

  // Consequence upgrades based on weight
  let consequence = baseConsequence;
  let weightTrigger = "";
  if (weight > 15000) {
    if (consequence < 3) {
      consequence = 3;
      weightTrigger = ` (Escalated to High: ${weight.toLocaleString()} MT > 15k MT)`;
    } else {
      weightTrigger = ` (High weight: ${weight.toLocaleString()} MT)`;
    }
  } else if (weight > 5000) {
    if (consequence < 2) {
      consequence = 2;
      weightTrigger = ` (Escalated to Med: ${weight.toLocaleString()} MT > 5k MT)`;
    } else {
      weightTrigger = ` (Med weight: ${weight.toLocaleString()} MT)`;
    }
  }

  const consequenceDesc = `Level ${consequence} - ${consequenceReason}${weightTrigger}`;

  // 3. Calculate Risk Score using 3x3 Matrix
  const riskScore = likelihood * consequence;

  // 4. Map Risk Score to Risk Level Tier
  let riskRating = "ROUTINE RISK";
  let focusAction = "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning.";

  if (riskScore >= 6) {
    riskRating = "CRITICAL RISK";
    focusAction = "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification.";
  } else if (riskScore >= 3) {
    riskRating = "ELEVATED RISK";
    focusAction = "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity.";
  }

  const primaryTrigger = `${commodityTrigger} [${likelihood}x${consequence}=${riskScore}]`;
  const inspectionFocus = `${focusAction} | Origin: ${likelihoodDesc} | Impact: ${consequenceDesc}`;

  const confidenceScore = riskScore >= 6 ? 0.95 : (riskScore >= 3 ? 0.85 : 0.90);

  const result = {
    risk_rating: riskRating,
    confidence_score: confidenceScore,
    primary_trigger: primaryTrigger,
    inspection_focus: inspectionFocus
  };

  return {
    risk: riskRating,
    memo: JSON.stringify(result)
  };
}

// Helpers
function getStore(key, defaults) {
  const data = localStorage.getItem(key);
  if (!data) {
    setStore(key, defaults);
    return defaults;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaults;
  }
}

function setStore(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    const isQuotaError = e.name === 'QuotaExceededError' || 
                         e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
                         e.code === 22 || 
                         e.code === 1014;
    if (isQuotaError) {
      console.warn("[localDb] LocalStorage quota exceeded. Attempting to prune image data to save space.");
      if (Array.isArray(val)) {
        const pruned = val.map(item => {
          const updated = { ...item };
          if (typeof updated.image_url === 'string' && updated.image_url.startsWith('data:image')) {
            updated.image_url = 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=400';
          }
          if (typeof updated.imagePath === 'string' && updated.imagePath.startsWith('data:image')) {
            updated.imagePath = 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=400';
          }
          return updated;
        });
        try {
          localStorage.setItem(key, JSON.stringify(pruned));
          console.log("[localDb] Successfully saved pruned data to LocalStorage.");
          return;
        } catch (innerErr) {
          console.error("[localDb] Pruning failed to resolve QuotaExceededError:", innerErr);
        }
      }
      
      // If still failing or not an array, clear logs and retry
      try {
        localStorage.removeItem("nmpa_logs");
        localStorage.setItem(key, JSON.stringify(val));
        console.log("[localDb] Saved successfully after clearing logs.");
      } catch (innerErr2) {
        console.error("[localDb] Clearing logs did not resolve QuotaExceededError:", innerErr2);
        // Force save by throwing away the image in the current payload
        if (typeof val === 'object' && val !== null) {
          console.warn("[localDb] Attempting extreme prune of images to force write...");
          const extremePruned = JSON.parse(JSON.stringify(val));
          const cleanItem = (item) => {
            if (item && typeof item === 'object') {
              if (typeof item.image_url === 'string' && item.image_url.startsWith('data:image')) {
                item.image_url = '';
              }
              if (typeof item.imagePath === 'string' && item.imagePath.startsWith('data:image')) {
                item.imagePath = '';
              }
            }
          };
          if (Array.isArray(extremePruned)) {
            extremePruned.forEach(cleanItem);
          } else {
            cleanItem(extremePruned);
          }
          try {
            localStorage.setItem(key, JSON.stringify(extremePruned));
            console.log("[localDb] Extreme prune successful, data saved.");
          } catch (innerErr3) {
            console.error("[localDb] Extreme prune failed, could not save:", innerErr3);
          }
        }
      }
    } else {
      throw e;
    }
  }
}

function logAction(action, role, details = "") {
  const logs = getStore("nmpa_logs", DEFAULT_LOGS);
  const newLog = {
    id: Date.now(),
    action,
    role,
    details,
    date: new Date().toISOString()
  };
  logs.unshift(newLog);
  setStore("nmpa_logs", logs);
}

// Initialize tables in localStorage
export function initLocalDb() {
  getStore("nmpa_users", DEFAULT_USERS);
  let inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
  
  // Recalculate/migrate all inspections in the mock localStorage DB to match the new 3x3 matrix logic
  let migrated = false;
  const updatedInspections = inspections.map(item => {
    // If the memo is missing or not a JSON string, or doesn't have the new matrix score trigger format:
    if (!item.rms_analysis_memo || !item.rms_analysis_memo.trim().startsWith('{') || !item.rms_analysis_memo.includes("[")) {
      const { risk, memo } = aiRmsAssess(item.cargo_type || item.commodity_desc || "", item.country_of_origin || item.origin_port || "", item.weight || item.gross_tonnage || 0);
      item.risk_level = risk;
      item.assigned_risk_level = risk;
      item.rms_risk_level = risk;
      item.inspection_summary = memo;
      item.rms_analysis_memo = memo;
      migrated = true;
    }
    return item;
  });
  
  if (migrated) {
    setStore("nmpa_inspections", updatedInspections);
    console.log("[localDb] Successfully migrated legacy mock inspections to 3x3 Risk Matrix.");
  }

  getStore("nmpa_logs", DEFAULT_LOGS);
  getStore("nmpa_complaints", DEFAULT_COMPLAINTS);
  getStore("nmpa_chairman_complaints", DEFAULT_CHAIRMAN_COMPLAINTS);
}

// Mock Fetch Wrapper
export function setupLocalDbFetch() {
  initLocalDb();

  const originalFetch = window.fetch;

  window.fetch = async function (url, options = {}) {
    const urlStr = typeof url === "string" ? url : url.url;
    
    // Intercept only API endpoints
    if (!urlStr.includes("/api/")) {
      return originalFetch.apply(this, arguments);
    }

    console.log(`[localDb Mock Fetch] Intercepted request: ${options.method || "GET"} ${urlStr}`);

    try {
      const method = (options.method || "GET").toUpperCase();
      const body = options.body ? JSON.parse(options.body) : {};
      
      const parsedUrl = new URL(urlStr, window.location.origin);
      const pathname = parsedUrl.pathname.replace(/\/(port_cargo_web|NMPA-Cargo-Inspection)/, ""); // remove base prefix if present
      const searchParams = parsedUrl.searchParams;

      // Helper to return JSON response
      const jsonResponse = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
          status,
          headers: { "Content-Type": "application/json" }
        });
      };

      // 1. POST /api/login
      if (pathname.endsWith("/api/login") && method === "POST") {
        const { username, password } = body;
        const users = getStore("nmpa_users", DEFAULT_USERS);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          if (!user.is_approved) {
            return jsonResponse({ status: "error", message: "Account pending approval from System Admin." }, 403);
          }
          user.last_login = new Date().toISOString();
          setStore("nmpa_users", users);
          logAction("Login", user.role, `User ${username} logged in`);
          
          return jsonResponse({
            status: "success",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              two_fa_enabled: user.two_fa_enabled
            }
          });
        }
        return jsonResponse({ status: "error", message: "Invalid credentials." }, 401);
      }

      // 2. /api/users
      if (pathname.endsWith("/api/users")) {
        const users = getStore("nmpa_users", DEFAULT_USERS);

        if (method === "GET") {
          return jsonResponse(users);
        }

        if (method === "POST") {
          const { username, password, email, role } = body;
          if (users.some(u => u.username === username)) {
            return jsonResponse({ status: "error", message: "Username already exists." }, 400);
          }
          const newUser = {
            id: Date.now(),
            username,
            password: password || "password123",
            email,
            role: role || "inspector",
            is_approved: true,
            two_fa_enabled: true,
            last_login: null
          };
          users.push(newUser);
          setStore("nmpa_users", users);
          logAction("Create User", "system_admin", `Created user ${username}`);
          return jsonResponse({ status: "success", user: newUser }, 201);
        }

        if (method === "PUT") {
          const { id, username, email, role, action } = body;
          const userIdx = users.findIndex(u => u.id === id);

          if (userIdx !== -1) {
            if (action === "approve") {
              users[userIdx].is_approved = true;
              logAction("Approve User", "system_admin", `Approved user ID ${id}`);
            } else if (action === "toggle_2fa") {
              users[userIdx].two_fa_enabled = !users[userIdx].two_fa_enabled;
              logAction("Toggle 2FA", "system_admin", `Toggled 2FA for user ID ${id}`);
            } else {
              users[userIdx].username = username || users[userIdx].username;
              users[userIdx].email = email || users[userIdx].email;
              users[userIdx].role = role || users[userIdx].role;
              logAction("Edit User Details", "system_admin", `Updated user ID ${id} details`);
            }
            setStore("nmpa_users", users);
            return jsonResponse({ status: "success", user: users[userIdx] });
          }
          return jsonResponse({ status: "error", message: "User not found." }, 404);
        }

        if (method === "DELETE") {
          const id = parseInt(searchParams.get("id"));
          const userIdx = users.findIndex(u => u.id === id);
          if (userIdx !== -1) {
            const deleted = users.splice(userIdx, 1)[0];
            setStore("nmpa_users", users);
            logAction("Delete User", "system_admin", `Deleted user ID ${id}`);
            return jsonResponse({ status: "success", user: deleted });
          }
          return jsonResponse({ status: "error", message: "User not found." }, 404);
        }
      }

      // 3. GET /api/inspections
      if (pathname.endsWith("/api/inspections") && method === "GET") {
        const inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
        return jsonResponse(inspections);
      }

      // 4. POST /api/evaluate
      if (pathname.endsWith("/api/evaluate") && method === "POST") {
        const { vesselImo, vesselName, countryOfOrigin, billOfLading, commodityDescription, grossTonnage, inspectorEmail } = body;
        const inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
        
        const { risk, memo } = aiRmsAssess(commodityDescription, countryOfOrigin, grossTonnage);

        const newInspection = {
          id: Date.now(),
          bill_of_lading: billOfLading,
          origin_port: countryOfOrigin,
          cargo_type: commodityDescription,
          weight: parseFloat(grossTonnage) || 0,
          image_url: "",
          risk_level: risk,
          status: "Awaiting Physical Inspection",
          inspector_email: inspectorEmail || "unknown@nmpa.gov",
          assigned_risk_level: risk,
          inspection_summary: memo,
          vessel_imo: vesselImo,
          vessel_name: vesselName,
          country_of_origin: countryOfOrigin,
          gross_tonnage: parseFloat(grossTonnage) || 0,
          rms_risk_level: risk,
          rms_analysis_memo: memo,
          actual_weight: null,
          seal_intact: null,
          structural_damage: null,
          qr_token: null,
          date: new Date().toISOString()
        };

        inspections.unshift(newInspection);
        setStore("nmpa_inspections", inspections);
        logAction("Register Manifest", "inspector", `B/L ${billOfLading} submitted for Vessel ${vesselName}`);

        return jsonResponse({
          id: newInspection.id,
          rms_risk_level: risk,
          rms_analysis_memo: memo,
          status: "Awaiting Physical Inspection"
        });
      }

      // 5. POST /api/inspections/inspect
      if (pathname.endsWith("/api/inspections/inspect") && method === "POST") {
        const { id, manifestId, actual_weight, seal_intact, structural_damage, image_url } = body;
        const inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
        
        let idx = -1;
        if (id) {
          idx = inspections.findIndex(i => i.id === id);
        } else if (manifestId) {
          idx = inspections.findIndex(i => i.bill_of_lading === manifestId);
        }

        if (idx !== -1) {
          inspections[idx].actual_weight = parseFloat(actual_weight) || 0;
          inspections[idx].seal_intact = seal_intact;
          inspections[idx].structural_damage = structural_damage;
          inspections[idx].image_url = image_url || inspections[idx].image_url;
          inspections[idx].status = "Inspected - Awaiting Authority Adjudication";
          
          setStore("nmpa_inspections", inspections);
          logAction("Inspect Cargo", "inspector", `Physical parameters logged for inspection ID ${inspections[idx].id}`);
          return jsonResponse({ status: "success" });
        }
        return jsonResponse({ status: "error", message: "Inspection record not found." }, 404);
      }

      // 6. POST /api/inspections/review
      if (pathname.endsWith("/api/inspections/review") && method === "POST") {
        const { id, status, notes } = body;
        const inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
        const idx = inspections.findIndex(i => i.id === id);

        if (idx !== -1) {
          inspections[idx].status = status;
          inspections[idx].notes = notes;
          
          let qrToken = null;
          if (status === "Port Clearance Granted" || status === "Approved") {
            qrToken = `NMPA-PCC-${id}-${Math.floor(100000 + Math.random() * 900000)}`;
            inspections[idx].qr_token = qrToken;
          }
          
          setStore("nmpa_inspections", inspections);
          logAction("Review Adjudication", "port_authority", `Manifest ${inspections[idx].bill_of_lading} marked as ${status}`);
          return jsonResponse({ status: "success", qrToken: qrToken });
        }
        return jsonResponse({ status: "error", message: "Inspection record not found." }, 404);
      }

      // 7. GET /api/clearance/verify
      if (pathname.endsWith("/api/clearance/verify") && method === "GET") {
        const token = searchParams.get("token");
        const inspections = getStore("nmpa_inspections", DEFAULT_INSPECTIONS);
        const record = inspections.find(i => i.qr_token === token);

        if (record) {
          // Format payload as expected by VerifyClearance page
          const verifyPayload = {
            status: "success",
            certificate: {
              qr_token: record.qr_token,
              bill_of_lading: record.bill_of_lading,
              vessel_name: record.vessel_name,
              vessel_imo: record.vessel_imo,
              gross_tonnage: record.gross_tonnage,
              cargo_type: record.cargo_type,
              country_of_origin: record.country_of_origin,
              rms_risk_level: record.rms_risk_level,
              adjudication_status: record.status,
              timestamp: record.date
            }
          };
          return jsonResponse(verifyPayload);
        }
        return jsonResponse({ status: "error", message: "Verification failed. Clearance certificate token invalid." }, 404);
      }

      // 8. GET /api/logs
      if (pathname.endsWith("/api/logs") && method === "GET") {
        const logs = getStore("nmpa_logs", DEFAULT_LOGS);
        return jsonResponse(logs);
      }

      // 9. /api/complaints
      if (pathname.endsWith("/api/complaints")) {
        if (method === "GET") {
          const complaints = getStore("nmpa_complaints", DEFAULT_COMPLAINTS);
          return jsonResponse(complaints);
        }

        if (method === "POST") {
          const { email, subject, category, message, description, isEscalatedToChairman, is_escalated_to_chairman, severityLevel, severity_level } = body;
          
          const finalSubj = subject || category;
          const finalMsg = message || description;
          const isEscalated = isEscalatedToChairman || is_escalated_to_chairman || false;
          const finalSev = severityLevel || severity_level || "Medium";

          if (isEscalated) {
            const chairComp = getStore("nmpa_chairman_complaints", DEFAULT_CHAIRMAN_COMPLAINTS);
            const newComp = {
              id: Date.now(),
              email,
              category: finalSubj,
              description: finalMsg,
              severity_level: finalSev,
              date: new Date().toISOString(),
              is_escalated_to_chairman: true
            };
            chairComp.unshift(newComp);
            setStore("nmpa_chairman_complaints", chairComp);
            logAction("Escalate Complaint", "System", `Escalated complaint by ${email} to Chairman`);
            return jsonResponse({
              status: "success",
              message: "Grievance escalated directly to Chairman.",
              routed_to: "CHAIRMAN_OFFICE_INBOX",
              id: newComp.id
            }, 201);
          } else {
            const comp = getStore("nmpa_complaints", DEFAULT_COMPLAINTS);
            const newComp = {
              id: Date.now(),
              email,
              subject: finalSubj,
              message: finalMsg,
              date: new Date().toISOString(),
              is_escalated_to_chairman: false,
              severity_level: finalSev
            };
            comp.unshift(newComp);
            setStore("nmpa_complaints", comp);
            logAction("Submit Complaint", "System", `Complaint submitted by ${email}`);
            return jsonResponse({
              status: "success",
              message: "Complaint submitted to standard queue.",
              routed_to: "STANDARD_GRIEVANCE_QUEUE",
              id: newComp.id
            }, 201);
          }
        }
      }

      // 10. GET /api/chairman/complaints
      if (pathname.endsWith("/api/chairman/complaints") && method === "GET") {
        const chair = getStore("nmpa_chairman_complaints", DEFAULT_CHAIRMAN_COMPLAINTS);
        return jsonResponse(chair);
      }

      // Fallback
      return originalFetch.apply(this, arguments);

    } catch (err) {
      console.error("[localDb Mock Fetch Error]", err);
      return originalFetch.apply(this, arguments);
    }
  };
}
