(function registerMockData(window) {
  const users = [
    { username: "admin", password: "admin123", name: "Admin" },
    { username: "executive", password: "exec12345", name: "Executive User" },
    { username: "qa", password: "qa123456", name: "Quality Assurance" },
    { username: "production", password: "prod12345", name: "Production Lead" },
    { username: "warehouse", password: "wh123456", name: "Warehouse User" },
  ];

  const productFamilies = [
    { key: "PE1", material: "PE White", jumboWidth: 1200, slitWidths: [300, 400, 150], thickness: 42, raw: "Polyethylene Resin Grade A" },
    { key: "PET", material: "PET Clear", jumboWidth: 1000, slitWidths: [250, 500, 125], thickness: 35, raw: "PET Clear Resin" },
    { key: "PEB", material: "PE Blue", jumboWidth: 900, slitWidths: [300, 450, 150], thickness: 40, raw: "Polyethylene Resin Grade B" },
    { key: "BOP", material: "BOPP Clear", jumboWidth: 1100, slitWidths: [275, 550, 137], thickness: 28, raw: "BOPP Clear Resin" },
  ];

  const productionDates = [
    "2026-01-06", "2026-01-10", "2026-01-16", "2026-01-24", "2026-01-30",
    "2026-02-04", "2026-02-09", "2026-02-14", "2026-02-20", "2026-02-27",
    "2026-03-03", "2026-03-08", "2026-03-15", "2026-03-21", "2026-03-29",
    "2026-04-04", "2026-04-10", "2026-04-16", "2026-04-22", "2026-04-28",
  ];

  const products = buildProducts();

  function buildProducts() {
    const items = [];
    let slitSequence = 1;

    productionDates.forEach((date, index) => {
      const family = productFamilies[index % productFamilies.length];
      const jumboSequence = index + 1;
      const jumboBatch = createBatch(date, jumboSequence);
      const jumboId = createId("JR", date, jumboSequence);
      const hasHoldStatus = [4, 9, 14].includes(jumboSequence);
      const jumbo = createJumboRoll({
        id: jumboId,
        batch: jumboBatch,
        sequence: jumboSequence,
        family,
        date,
        hasHoldStatus,
      });

      items.push(jumbo);

      const slitCount = index < 10 ? 2 : 1;
      let currentParent = jumbo;

      for (let slitIndex = 0; slitIndex < slitCount; slitIndex += 1) {
        const isIntermediate = slitIndex === 0 && index % 5 === 0 && slitCount > 1;
        const sourceProduct = currentParent;
        const slitDate = addHours(date, 5 + slitIndex * 3);
        const slitBatch = createBatch(date, 40 + slitSequence);
        const slitId = createId("SR", date, 40 + slitSequence);
        const slit = createSlitRoll({
          id: slitId,
          batch: slitBatch,
          sequence: slitSequence,
          family,
          date,
          sourceProduct,
          width: family.slitWidths[slitIndex % family.slitWidths.length],
          productionTime: slitDate,
          isIntermediate,
          hasFailStatus: [7, 18, 26].includes(slitSequence),
        });

        sourceProduct.timeline.push({
          time: slit.productionTime,
          place: `Slitter Line ${(slitSequence % 3) + 1}`,
          note: `Digunakan untuk membentuk ${slit.batch} - ${slit.name}.`,
          relatedProductId: slit.id,
          relatedProductLabel: slit.batch,
        });

        if (sourceProduct.type === "Jumbo Roll") {
          sourceProduct.location = `Terpakai untuk Slitting - Slitter Line ${(slitSequence % 3) + 1}`;
        } else {
          sourceProduct.location = `Terpakai untuk Slitting - Slitter Line ${(slitSequence % 3) + 1}`;
        }

        items.push(slit);
        currentParent = isIntermediate ? slit : jumbo;
        slitSequence += 1;
      }
    });

    return items.sort((a, b) => b.productionTime.localeCompare(a.productionTime));
  }

  function createJumboRoll({ id, batch, sequence, family, date, hasHoldStatus }) {
    const productionTime = `${date} ${String(7 + (sequence % 4)).padStart(2, "0")}:15`;
    const qcStatus = hasHoldStatus ? "FAIL" : "PASS";

    return {
      id,
      batch,
      code: `JR${family.key}I`,
      name: `Jumbo Roll ${family.material} ${family.jumboWidth}mm`,
      type: "Jumbo Roll",
      productionTime,
      location: hasHoldStatus ? `Hold Area - Rack ${String((sequence % 5) + 1).padStart(2, "0")}` : `Warehouse ${sequence % 2 ? "A" : "B"} - Bay ${String((sequence % 12) + 1).padStart(2, "0")}`,
      qcStatus,
      source: [`RM-${family.key}-${8000 + sequence}`, `RM-ADD-${100 + sequence}`],
      characteristics: {
        width: `${family.jumboWidth} mm`,
        length: `${6200 + sequence * 35} m`,
        thickness: `${family.thickness} micron`,
        weight: `${520 + sequence * 9} kg`,
        core: "6 inch",
        line: `Extruder Line ${(sequence % 3) + 1}`,
      },
      qcDetails: createQcDetails(qcStatus, "jumbo", family),
      timeline: [
        { time: `${date} 06:45`, place: "Material Staging", note: "Raw material ditimbang dan diverifikasi." },
        { time: `${date} 07:20`, place: `Extruder Line ${(sequence % 3) + 1}`, note: "Proses pembentukan jumbo roll dimulai." },
        { time: productionTime, place: "QC Inline", note: qcStatus === "PASS" ? "Sampling karakteristik dan visual check lulus." : "Produk ditahan karena parameter QC tidak memenuhi spesifikasi." },
        { time: `${date} ${String(10 + (sequence % 5)).padStart(2, "0")}:05`, place: qcStatus === "PASS" ? "Warehouse Staging" : "Hold Area", note: qcStatus === "PASS" ? "Produk masuk stok siap slitting." : "Produk menunggu keputusan QA." },
      ],
      materials: [
        { id: `RM-${family.key}-${8000 + sequence}`, type: "Raw Material", name: family.raw, batch: `90000${String(8000 + sequence).padStart(5, "0")}`, quantity: `${500 + sequence * 8} kg` },
        { id: `RM-ADD-${100 + sequence}`, type: "Raw Material", name: "Additive Masterbatch", batch: `90000${String(100 + sequence).padStart(5, "0")}`, quantity: `${18 + (sequence % 8)} kg` },
      ],
    };
  }

  function createSlitRoll({ id, batch, sequence, family, date, sourceProduct, width, productionTime, isIntermediate, hasFailStatus }) {
    const qcStatus = hasFailStatus ? "FAIL" : "PASS";
    const finalFlag = isIntermediate ? "I" : "O";
    const productCode = normalizeCode(family.key, sequence);

    return {
      id,
      batch,
      code: `SR${productCode}${finalFlag}`,
      name: `Slit Roll ${family.material} ${width}mm`,
      type: "Slit Roll",
      productionTime,
      location: isIntermediate ? "Packing Area - Menunggu Slitting Lanjutan" : `Dispatch Lane ${(sequence % 4) + 1}`,
      qcStatus,
      source: [sourceProduct.id],
      characteristics: {
        width: `${width} mm`,
        length: `${5900 + sequence * 22} m`,
        thickness: `${family.thickness} micron`,
        weight: `${90 + sequence * 6} kg`,
        core: "3 inch",
        line: `Slitter Line ${(sequence % 3) + 1}`,
      },
      qcDetails: createQcDetails(qcStatus, "slit", family),
      timeline: [
        { time: addHours(date, 5), place: `Slitter Line ${(sequence % 3) + 1}`, note: sourceProduct.type === "Slit Roll" ? "Produk terbentuk dari proses slitting lanjutan." : "Produk terbentuk dari proses slitting jumbo roll." },
        { time: productionTime, place: "QC Final", note: qcStatus === "PASS" ? "QC final lulus." : "QC final menemukan parameter yang perlu evaluasi." },
        { time: addHours(date, 7 + (sequence % 4)), place: isIntermediate ? "Packing Area - Menunggu Slitting Lanjutan" : `Dispatch Lane ${(sequence % 4) + 1}`, note: isIntermediate ? "Produk disiapkan sebagai input slitting lanjutan." : "Produk final siap dikirim atau masuk finish good." },
      ],
      materials: [
        { id: sourceProduct.id, type: sourceProduct.type, name: sourceProduct.name, batch: sourceProduct.batch, quantity: sourceProduct.type === "Jumbo Roll" ? "1 parent roll" : "1 input roll" },
      ],
    };
  }

  function createQcDetails(status, type, family) {
    const markFail = (items, failIndexes) =>
      items.map((item, index) => {
        if (!failIndexes.includes(index)) return item;

        return {
          ...item,
          result: "FAIL",
          value: item.failValue,
          reason: item.failReason,
          action: item.action,
        };
      });

    const jumboItems = [
      qcItem("Thickness", "+/- 1.2 micron", "+/- 2.0 micron", "Micrometer sampling", "Left / Center / Right", `Thickness profile for ${family.material} is within tolerance.`, "+/- 2.8 micron", "Thickness variance exceeds maximum tolerance.", "Hold for QA disposition and extrusion profile review."),
      qcItem("Width", `${family.jumboWidth} mm`, `${family.jumboWidth} mm +/- 2 mm`, "Tape measurement", "Roll face width", "Width is aligned with product specification.", `${family.jumboWidth + 5} mm`, "Width is outside product tolerance.", "Hold and review edge trim setting."),
      qcItem("Surface Defect", "0 critical defect", "No critical defect", "Visual inspection", "Outer layer and random unwind", "No critical visual defect found.", "2 visual defects", "Critical visual defects found on sampling area.", "Hold for QA disposition."),
      qcItem("Winding Tension", "Normal", "Stable winding profile", "Tension log review", "Winder output", "Winding tension is stable.", "Unstable", "Winding tension is not stable across the roll.", "Review winding setup before release."),
      qcItem("Roll Hardness", "82 Shore A", "78-88 Shore A", "Hardness tester", "Left / Center / Right", "Roll hardness is evenly distributed.", "72 Shore A", "Roll hardness is below standard.", "Hold for winding evaluation."),
      qcItem("Appearance", "OK", "Color and appearance within standard", "Visual inspection", "Outer roll surface", "Appearance is acceptable.", "Streak marks", "Appearance does not meet visual standard.", "Segregate and review with QA."),
      qcItem("Label Verification", "Matched batch", "Batch and product code match system", "Barcode scan", "Roll label", "Label data matches production record.", "Mismatch", "Label data does not match production record.", "Block release until label is corrected."),
    ];

    const slitItems = [
      qcItem("Slit Width", "Within tolerance", "Nominal width +/- 1 mm", "Caliper measurement", "Left / Center / Right", "Slit width is within tolerance.", "Out of tolerance", "Slit width exceeds tolerance.", "Hold and review slitter knife position."),
      qcItem("Slit Edge Quality", "Clean edge", "No burr / tear / feathering", "Visual inspection", "Both roll edges", "Edge condition is acceptable.", "Minor burr", "Edge has burr and needs slitter setup review.", "Hold for QA disposition and knife setting review."),
      qcItem("Roll Alignment", "1.4 mm offset", "Max 2.0 mm offset", "Side face visual check", "Roll side face", "Roll alignment is within tolerance.", "3.2 mm offset", "Offset exceeds tolerance.", "Hold for QA disposition and rewinding review."),
      qcItem("Winding Tension", "Normal", "Stable rewinding tension", "Tension log review", "Rewinder output", "Winding tension is stable.", "Loose winding", "Winding tension is below standard.", "Rework or hold for QA disposition."),
      qcItem("Surface Condition", "No damage", "No wrinkle / scratch / contamination", "Visual inspection", "Outer surface", "Surface condition is acceptable.", "Scratch found", "Surface damage found during inspection.", "Segregate affected roll."),
      qcItem("Label Verification", "Matched batch", "Batch, product code, and quantity match system", "Barcode scan", "Product label", "Label matches production and parent roll record.", "Mismatch", "Label does not match production record.", "Block release until label is corrected."),
      qcItem("Traceability Link", "Linked to source roll", "Source roll must be recorded", "System verification", "Traceability record", "Material source is linked correctly.", "Missing link", "Source roll link is incomplete.", "Hold until traceability record is corrected."),
    ];

    return status === "FAIL"
      ? markFail(type === "jumbo" ? jumboItems : slitItems, type === "jumbo" ? [0, 2, 5] : [1, 2, 4])
      : type === "jumbo"
        ? jumboItems
        : slitItems;
  }

  function qcItem(parameter, value, standard, method, samplePoint, assessment, failValue, failReason, action) {
    return {
      parameter,
      value,
      result: "PASS",
      standard,
      method,
      samplePoint,
      assessment,
      failValue,
      failReason,
      action,
    };
  }

  function createBatch(date, sequence) {
    return `${date.replaceAll("-", "")}${String(sequence).padStart(2, "0")}`.slice(0, 10);
  }

  function createId(prefix, date, sequence) {
    const [, month, day] = date.split("-");
    return `${prefix}-260${month}${day}-${String(sequence).padStart(3, "0")}`;
  }

  function addHours(date, hour) {
    return `${date} ${String(hour).padStart(2, "0")}:${hour % 2 ? "35" : "10"}`;
  }

  function normalizeCode(key, sequence) {
    const suffix = String(sequence % 10);
    return `${key}${suffix}`.slice(0, 3).padEnd(3, suffix);
  }

  window.RollTraceMockData = {
    credentials: users,
    users,
    products,
  };
})(window);
