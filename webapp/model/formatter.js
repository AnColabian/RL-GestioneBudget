sap.ui.define([], function () {
    "use strict";
    return {
        formatImporto: function (fValore, sValuta) {
            if (fValore === undefined || fValore === null || fValore === "") {
                return "";
            }
            var fNum = parseFloat(fValore);
            if (isNaN(fNum)) {
                return fValore;
            }
            var sValutaEffettiva = sValuta || "EUR";
            try {
                return fNum.toLocaleString("it-IT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + "\u00a0" + sValutaEffettiva;
            } catch (e) {
                return fNum.toFixed(2) + "\u00a0" + sValutaEffettiva;
            }
        },
        formatStatoResiduo: function (fResiduo) {
            if (fResiduo === undefined || fResiduo === null || fResiduo === "") {
                return "None";
            }
            var fNum = parseFloat(fResiduo);
            if (isNaN(fNum) || fNum <= 0) {
                return "Error";
            }
            if (fNum < 0.2) {
                return "Warning";
            }
            return "Success";
        },
        formatLabelStatoResiduo: function (fResiduo) {
            if (fResiduo === undefined || fResiduo === null || fResiduo === "") {
                return "";
            }
            var fNum = parseFloat(fResiduo);
            if (isNaN(fNum) || fNum <= 0) {
                return "Esaurito";
            }
            if (fNum < 0.2) {
                return "In esaurimento";
            }
            return "Disponibile";
        },
        formatData: function (sData) {
            if (!sData) {
                return "";
            }
            if (sData instanceof Date) {
                return sData.toLocaleDateString("it-IT");
            }
            var oMatch = String(sData).match(/(\d{4})(\d{2})(\d{2})/);
            if (oMatch) {
                return oMatch[3] + "/" + oMatch[2] + "/" + oMatch[1];
            }
            return sData;
        }
    };
});