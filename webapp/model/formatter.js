sap.ui.define([], function () {
    "use strict";
    return {
        formatImporto: function (fValore) {
            if (fValore === undefined || fValore === null || fValore === "") {
                return "";
            }
            var fNum = parseFloat(fValore);
            if (isNaN(fNum)) {
                return fValore;
            }
            try {
                return fNum.toLocaleString("it-IT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            } catch (e) {
                return fNum.toFixed(2);
            }
        },
        formatStatoResiduo: function (fResiduo) {
            if (fResiduo === undefined || fResiduo === null || fResiduo === "") {
                return "None";
            }
            var fNum = parseFloat(fResiduo);
            if (isNaN(fNum)) {
                return "None";
            }
            if (fNum <= 0) {
                return "Error";
            }
            if (fNum <= 1000) {
                return "Warning";
            }
            return "Success";
        },
        formatLabelStatoResiduo: function (fResiduo) {
            if (fResiduo === undefined || fResiduo === null || fResiduo === "") {
                return "";
            }
            var fNum = parseFloat(fResiduo);
            if (isNaN(fNum)) {
                return "";
            }
            if (fNum <= 0) {
                return "Esaurito";
            }
            if (fNum <= 1000) {
                return "In esaurimento";
            }
            return "Disponibile";
        },
        formatData: function (sData) {
            if (!sData || sData.trim() === "") {
                return "";
            }
            if (sData instanceof Date) {
                return sData.toLocaleDateString("it-IT");
            }
            var sStr = String(sData).trim();
            var oMatchCompact = sStr.match(/^(\d{4})(\d{2})(\d{2})$/);
            if (oMatchCompact) {
                var sGiorno = oMatchCompact[3];
                var sMese = oMatchCompact[2];
                var sAnno = oMatchCompact[1];
                if (sGiorno === "00" || sMese === "00") {
                    return "";
                }
                return sGiorno + "/" + sMese + "/" + sAnno;
            }
            var oMatchISO = sStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (oMatchISO) {
                if (oMatchISO[3] === "00" || oMatchISO[2] === "00") {
                    return "";
                }
                return oMatchISO[3] + "/" + oMatchISO[2] + "/" + oMatchISO[1];
            }
            return sData;
        },
        formatStatoResiduoPercentuale: function (fResiduo, fAssegnato) {
            if (fResiduo === undefined || fResiduo === null || fResiduo === "") {
                return "None";
            }
            if (fAssegnato === undefined || fAssegnato === null || fAssegnato === "" || parseFloat(fAssegnato) === 0) {
                return "None";
            }
            var fNum = parseFloat(fResiduo);
            var fTot = parseFloat(fAssegnato);
            if (isNaN(fNum) || isNaN(fTot)) {
                return "None";
            }
            if (fNum <= 0) {
                return "Error";
            }
            if (fNum / fTot <= 0.20) {
                return "Warning";
            }
            return "Success";
        }
    };
});