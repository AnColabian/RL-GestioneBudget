sap.ui.define([], function () {
    "use strict";
    return {
        formatImporto: function (fValore) {
            if (fValore === undefined || fValore === null || fValore === "") { return ""; }
            var fNum = typeof fValore === "number" ? fValore : parseFloat(fValore);
            if (isNaN(fNum)) { return String(fValore); }
            try {
                return fNum.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) { return fNum.toFixed(2); }
        },
        formatData: function (sData) {
            if (!sData) { return ""; }
            if (sData instanceof Date) { return sData.toLocaleDateString("it-IT"); }
            if (typeof sData === "string") {
                var oMatchMs = sData.match(/\/Date\((\d+)\)\//);
                if (oMatchMs) { return new Date(parseInt(oMatchMs[1], 10)).toLocaleDateString("it-IT"); }
                var sStr = sData.trim();
                var oMatchCompact = sStr.match(/^(\d{4})(\d{2})(\d{2})$/);
                if (oMatchCompact) {
                    if (oMatchCompact[3] === "00" || oMatchCompact[2] === "00") { return ""; }
                    return oMatchCompact[3] + "/" + oMatchCompact[2] + "/" + oMatchCompact[1];
                }
                var oMatchISO = sStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (oMatchISO) {
                    if (oMatchISO[3] === "00" || oMatchISO[2] === "00") { return ""; }
                    return oMatchISO[3] + "/" + oMatchISO[2] + "/" + oMatchISO[1];
                }
            }
            return sData;
        },
        formatResiduoDG: function (fAssegnato, fDistribuito) {
            if (fAssegnato === undefined || fAssegnato === null || fAssegnato === "") {
                return "";
            }
            var fAss = parseFloat(fAssegnato) || 0;
            var fDist = parseFloat(fDistribuito) || 0;
            var fResiduo = fAss - fDist;
            try {
                return fResiduo.toLocaleString("it-IT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            } catch (e) {
                return fResiduo.toFixed(2);
            }
        },
        formatStatoResiduoDG: function (fAssegnato, fDistribuito) {
            if (fAssegnato === undefined || fAssegnato === null || fAssegnato === "") {
                return "None";
            }
            var fAss = parseFloat(fAssegnato) || 0;
            if (fAss === 0) {
                return "None";
            }
            var fDist = parseFloat(fDistribuito) || 0;
            var fResiduo = fAss - fDist;
            if (fResiduo <= 0) {
                return "Error";
            }
            if (fResiduo / fAss <= 0.20) {
                return "Warning";
            }
            return "Success";
        },
        formatLabelStatoResiduoDG: function (fAssegnato, fDistribuito) {
            if (fAssegnato === undefined || fAssegnato === null || fAssegnato === "") {
                return "";
            }
            var fAss = parseFloat(fAssegnato) || 0;
            if (fAss === 0) {
                return "";
            }
            var fDist = parseFloat(fDistribuito) || 0;
            var fResiduo = fAss - fDist;
            if (fResiduo <= 0) {
                return "Esaurito";
            }
            if (fResiduo / fAss <= 0.20) {
                return "In esaurimento";
            }
            return "Disponibile";
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