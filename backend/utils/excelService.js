import XLSX from "xlsx";

class ExcelService {
  static getReport(reportData, headers, tabName = "Sheet1", type = "xlsx") {
    let aoaReportData;
    if (reportData.length && Array.isArray(reportData[0])) {
      aoaReportData = reportData;
    } else if (!reportData.length) {
      aoaReportData = [];
      aoaReportData.unshift(Object.keys({ "No data to report": "" }));
    } else {
      if (headers) {
        aoaReportData = reportData.map((l) => headers.map((k) => l[k]));
      } else {
        aoaReportData = reportData.map((l) => Object.values(l));
      }
      aoaReportData.unshift(headers || Object.keys(reportData[0]));
    }

    //columns width calculation
    let maxLength = [];
    //data width calc
    for (let i = 0; i < aoaReportData.length; i++) {
      for (let j = 0; j < aoaReportData[i].length; j++) {
        let currentValue = aoaReportData[i][j];
        if (!currentValue && currentValue !== 0) {
          continue;
        }
        if (typeof currentValue == "number") {
          maxLength[j] = Math.max(maxLength[j] || 0, 10);
        } else if (currentValue instanceof Date) {
          maxLength[j] = Math.max(maxLength[j] || 0, 16);
          aoaReportData[i][j] = {
            v: currentValue,
            t: "d",
            z: XLSX.SSF._table[22],
          };
        } else if (typeof currentValue == "object" && (currentValue.w || currentValue.v)) {
          maxLength[j] = Math.max(maxLength[j] || 0, (currentValue.w || currentValue.v).length || 0);
        } else {
          maxLength[j] = Math.max(maxLength[j] || 0, currentValue.length + 2 || 0);
        }
      }
    }

    let ws = XLSX.utils.aoa_to_sheet(aoaReportData);
    //columns width assignment

    ws["!cols"] = maxLength.map((l) => ({ wch: l }));

    if (type == "xlsx" || type == "xls") {
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tabName);
      return XLSX.write(wb, { type: "buffer", bookType: type, compression: true });
    } else {
      return Buffer.from(XLSX.utils.sheet_to_csv(ws, { FS: ";" }));
    }
  }
}

export { ExcelService };
