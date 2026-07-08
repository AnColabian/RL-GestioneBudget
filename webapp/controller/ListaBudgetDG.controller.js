sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "rlbudget/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageBox, formatter) {
    "use strict";
    return Controller.extend("rlbudget.controller.ListaBudgetDG", {
        formatter: formatter,
        onInit: function () {
            var iAnnoCorrente = new Date().getFullYear();
            var oViewModel = new JSONModel({
                filtroEsercizio: iAnnoCorrente.toString(),
                filtroCdCDG: "",
                busy: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            this._popolaAnni(iAnnoCorrente);
            this.getOwnerComponent().getRouter()
                .getRoute("RouteLista")
                .attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {
            this._caricaDati();
        },
        _popolaAnni: function (iAnnoCorrente) {
            var aAnni = [{ key: "", text: this._getText("lblTutti") }];
            for (var i = iAnnoCorrente + 1; i >= iAnnoCorrente - 5; i--) {
                aAnni.push({ key: i.toString(), text: i.toString() });
            }
            var oSelect = this.byId("selEsercizio");
            var oItemTemplate = new sap.ui.core.Item({
                key: "{viewModel>key}",
                text: "{viewModel>text}"
            });
            this.getView().getModel("viewModel").setProperty("/anni", aAnni);
            oSelect.bindItems({
                path: "viewModel>/anni",
                template: oItemTemplate
            });
        },
        _getText: function (sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },
        _caricaDati: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oModel = this.getOwnerComponent().getModel();
            oViewModel.setProperty("/busy", true);
            oModel.read("/Budget_DG", {
                success: function () {
                    oViewModel.setProperty("/busy", false);
                    this._applicaFiltriLocali();
                }.bind(this),
                error: function (oError) {
                    oViewModel.setProperty("/busy", false);
                    var sMsg = this._getText("msgErroreCaricamento");
                    try {
                        var oResp = JSON.parse(oError.responseText);
                        if (oResp.error && oResp.error.message && oResp.error.message.value) {
                            sMsg = oResp.error.message.value;
                        }
                    } catch (e) { }
                    MessageBox.error(sMsg);
                }.bind(this)
            });
        },
        _applicaFiltriLocali: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var sEsercizio = oViewModel.getProperty("/filtroEsercizio");
            var sCdCDG = (oViewModel.getProperty("/filtroCdCDG") || "").trim();
            var aFiltri = [];
            if (sEsercizio) {
                aFiltri.push(new Filter("ESERCIZIO", FilterOperator.EQ, sEsercizio));
            }
            if (sCdCDG !== "") {
                aFiltri.push(new Filter("CENTRO_DI_COSTO_DG", FilterOperator.Contains, sCdCDG));
            }
            var oBinding = this.byId("tblBudgetDG").getBinding("items");
            if (oBinding) {
                oBinding.filter(aFiltri);
            }
        },
        onFiltroChange: function () {
            this._applicaFiltriLocali();
        },
        onResetFiltri: function () {
            var iAnnoCorrente = new Date().getFullYear();
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/filtroEsercizio", iAnnoCorrente.toString());
            oViewModel.setProperty("/filtroCdCDG", "");
            this._applicaFiltriLocali();
        },
        onSearchBudgetDG: function (oEvent) {
            var sQuery = (oEvent.getParameter("query") || "").trim();
            var aFiltri = [];
            if (sQuery !== "") {
                aFiltri.push(new Filter({
                    filters: [
                        new Filter("CENTRO_DI_COSTO_DG", FilterOperator.Contains, sQuery),
                        new Filter("ESERCIZIO", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            var oBinding = this.byId("tblBudgetDG").getBinding("items");
            if (oBinding) {
                oBinding.filter(aFiltri);
            }
        },
        onApriDettaglio: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            this.getOwnerComponent().getRouter().navTo("RouteDettaglio", {
                Gjahr: oCtx.getProperty("ESERCIZIO"),
                KostlDg: encodeURIComponent(oCtx.getProperty("CENTRO_DI_COSTO_DG"))
            });
        },
        onCreaBudgetDG: function () {
            MessageBox.information(this._getText("msgFunzioneStep2"));
        },
        onCopiaEsercizio: function () {
            MessageBox.information(this._getText("msgFunzioneStep2"));
        }
    });
});