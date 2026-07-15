sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "rlbudget/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, Fragment, formatter) {
    "use strict";
    return Controller.extend("rlbudget.controller.DettaglioBudgetDG", {
        formatter: formatter,
        onInit: function () {
            var oViewModel = new JSONModel({
                ESERCIZIO: "",
                CENTRO_DI_COSTO_DG: "",
                IMPORTO_ASSEGNATO: "",
                IMPORTO_DISTRIBUITO: "",
                IMPORTO_RESIDUO: "",
                DATA_ASSEGNAZIONE: "",
                UTENTE_ASSEGNAZIONE: "",
                DATA_MODIFICA: "",
                UTENTE_MODIFICA: "",
                snappedTitle: "",
                budgetUO: [],
                writeEnabled: false,
                dialogModifica: {
                    ESERCIZIO: "",
                    CENTRO_DI_COSTO_DG: "",
                    IMPORTO_ASSEGNATO: "",
                    ImportoValueState: "None",
                    ImportoValueStateText: ""
                },
                dialogUOTitolo: "",
                dialogUOCdCUOEditable: true,
                dialogUO: {
                    ESERCIZIO: "",
                    CENTRO_DI_COSTO_DG: "",
                    CENTRO_DI_COSTO_UO: "",
                    IMPORTO_ASSEGNATO: "",
                    IMPORTO_CONSUMATO: "",
                    DATA_ASSEGNAZIONE: "",
                    UTENTE_ASSEGNAZIONE: "",
                    DATA_MODIFICA: "",
                    UTENTE_MODIFICA: "",
                    CdCUOValueState: "None",
                    CdCUOValueStateText: "",
                    ImportoValueState: "None",
                    ImportoValueStateText: ""
                }
            });
            this.getView().setModel(oViewModel, "viewModel");
            this.getOwnerComponent().getRouter()
                .getRoute("RouteDettaglio")
                .attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function (oEvent) {
            var sGjahr = oEvent.getParameter("arguments").Gjahr;
            var sKostlDg = decodeURIComponent(oEvent.getParameter("arguments").KostlDg);
            this._sEsercizio = sGjahr;
            this._sKostlDg = sKostlDg;
            this._caricaDatiDG(sGjahr, sKostlDg);
        },
        _caricaDatiDG: function (sEsercizio, sKostlDg) {
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/Budget_DG", {
                success: function (oData) {
                    var aRisultati = oData.results || [];
                    var oTrovato = aRisultati.find(function (oItem) {
                        return oItem.ESERCIZIO === sEsercizio && oItem.CENTRO_DI_COSTO_DG === sKostlDg;
                    });
                    if (oTrovato) {
                        this._popolaDatiDG(oTrovato);
                        this._caricaDatiUO(sEsercizio, sKostlDg);
                    } else {
                        MessageBox.error(this._getText("msgDatiNonTrovati"));
                    }
                }.bind(this),
                error: function (oError) {
                    this._gestisciErrore(oError);
                }.bind(this)
            });
        },
        _popolaDatiDG: function (oItem) {
            var oViewModel = this.getView().getModel("viewModel");
            var fAssegnato = parseFloat(oItem.IMPORTO_ASSEGNATO) || 0;
            var fDistribuito = parseFloat(oItem.IMPORTO_DISTRIBUITO) || 0;
            var fResiduo = fAssegnato - fDistribuito;
            oViewModel.setProperty("/ESERCIZIO", oItem.ESERCIZIO);
            oViewModel.setProperty("/CENTRO_DI_COSTO_DG", oItem.CENTRO_DI_COSTO_DG);
            oViewModel.setProperty("/IMPORTO_ASSEGNATO", oItem.IMPORTO_ASSEGNATO);
            oViewModel.setProperty("/IMPORTO_DISTRIBUITO", oItem.IMPORTO_DISTRIBUITO);
            oViewModel.setProperty("/IMPORTO_RESIDUO", fResiduo.toFixed(2));
            oViewModel.setProperty("/DATA_ASSEGNAZIONE", oItem.DATA_ASSEGNAZIONE);
            oViewModel.setProperty("/UTENTE_ASSEGNAZIONE", oItem.UTENTE_ASSEGNAZIONE);
            oViewModel.setProperty("/DATA_MODIFICA", oItem.DATA_MODIFICA);
            oViewModel.setProperty("/UTENTE_MODIFICA", oItem.UTENTE_MODIFICA);
            oViewModel.setProperty("/snappedTitle", oItem.ESERCIZIO + " \u2013 " + oItem.CENTRO_DI_COSTO_DG);
            oViewModel.setProperty("/writeEnabled", true);
        },
        _caricaDatiUO: function (sEsercizio, sKostlDg) {
            var oModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("viewModel");
            oModel.read("/Budget_UO", {
                success: function (oData) {
                    var aRisultati = oData.results || [];
                    var aUO = aRisultati
                        .filter(function (oItem) {
                            return oItem.ESERCIZIO === sEsercizio && oItem.CENTRO_DI_COSTO_DG === sKostlDg;
                        })
                        .map(function (oItem) {
                            var fAss = parseFloat(oItem.IMPORTO_ASSEGNATO) || 0;
                            var fCons = parseFloat(oItem.IMPORTO_CONSUMATO) || 0;
                            var oRiga = Object.assign({}, oItem);
                            oRiga.IMPORTO_RESIDUO = (fAss - fCons).toFixed(2);
                            return oRiga;
                        });
                    oViewModel.setProperty("/budgetUO", aUO);
                }.bind(this),
                error: function (oError) {
                    this._gestisciErrore(oError);
                }.bind(this)
            });
        },
        _gestisciErrore: function (oError) {
            var sMsg = this._getText("msgErroreCaricamento");
            try {
                var oResp = JSON.parse(oError.responseText);
                if (oResp.error && oResp.error.message && oResp.error.message.value) {
                    sMsg = oResp.error.message.value;
                }
            } catch (e) { }
            MessageBox.error(sMsg);
        },
        _getText: function (sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        },
        _validaDialogUO: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oDialogUO = oViewModel.getProperty("/dialogUO");
            var bValido = true;
            oViewModel.setProperty("/dialogUO/CdCUOValueState", "None");
            oViewModel.setProperty("/dialogUO/CdCUOValueStateText", "");
            oViewModel.setProperty("/dialogUO/ImportoValueState", "None");
            oViewModel.setProperty("/dialogUO/ImportoValueStateText", "");
            if (!oDialogUO.CENTRO_DI_COSTO_UO || oDialogUO.CENTRO_DI_COSTO_UO.trim() === "") {
                oViewModel.setProperty("/dialogUO/CdCUOValueState", "Error");
                oViewModel.setProperty("/dialogUO/CdCUOValueStateText", this._getText("msgCdCUOObbligatorio"));
                bValido = false;
            } else if (oDialogUO.CENTRO_DI_COSTO_UO.trim() === oDialogUO.CENTRO_DI_COSTO_DG) {
                oViewModel.setProperty("/dialogUO/CdCUOValueState", "Warning");
                oViewModel.setProperty("/dialogUO/CdCUOValueStateText", this._getText("msgCdCUOugualeDG"));
            }
            var fImporto = parseFloat(oDialogUO.IMPORTO_ASSEGNATO);
            if (!oDialogUO.IMPORTO_ASSEGNATO || oDialogUO.IMPORTO_ASSEGNATO.trim() === "" || isNaN(fImporto) || fImporto <= 0) {
                oViewModel.setProperty("/dialogUO/ImportoValueState", "Error");
                oViewModel.setProperty("/dialogUO/ImportoValueStateText", this._getText("msgImportoObbligatorio"));
                bValido = false;
            } else {
                var fResiduoDG = parseFloat(oViewModel.getProperty("/IMPORTO_RESIDUO")) || 0;
                var fConsumatoUO = parseFloat(oDialogUO.IMPORTO_CONSUMATO) || 0;
                if (fImporto < fConsumatoUO) {
                    oViewModel.setProperty("/dialogUO/ImportoValueState", "Error");
                    oViewModel.setProperty("/dialogUO/ImportoValueStateText", this._getText("msgImportoSottoConsumato"));
                    bValido = false;
                } else if (fImporto > fResiduoDG) {
                    oViewModel.setProperty("/dialogUO/ImportoValueState", "Warning");
                    oViewModel.setProperty("/dialogUO/ImportoValueStateText", this._getText("msgImportoSuperaResiduo"));
                }
            }
            return bValido;
        },
        onModificaBudgetDG: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogModifica", {
                ESERCIZIO: oViewModel.getProperty("/ESERCIZIO"),
                CENTRO_DI_COSTO_DG: oViewModel.getProperty("/CENTRO_DI_COSTO_DG"),
                IMPORTO_ASSEGNATO: String(oViewModel.getProperty("/IMPORTO_ASSEGNATO")),
                ImportoValueState: "None",
                ImportoValueStateText: ""
            });
            if (!this._oDialogModifica) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "rlbudget.view.fragment.ModificaBudgetDG",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogModifica = oDialog;
                    this.getView().addDependent(this._oDialogModifica);
                    this._oDialogModifica.open();
                }.bind(this));
            } else {
                this._oDialogModifica.open();
            }
        },
        onModificaImportoLiveChange: function () {
            this.getView().getModel("viewModel").setProperty("/dialogModifica/ImportoValueState", "None");
            this.getView().getModel("viewModel").setProperty("/dialogModifica/ImportoValueStateText", "");
        },
        _validaDialogModifica: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oMod = oViewModel.getProperty("/dialogModifica");
            var fImporto = parseFloat(oMod.IMPORTO_ASSEGNATO);
            var fDistribuito = parseFloat(oViewModel.getProperty("/IMPORTO_DISTRIBUITO")) || 0;
            oViewModel.setProperty("/dialogModifica/ImportoValueState", "None");
            oViewModel.setProperty("/dialogModifica/ImportoValueStateText", "");
            if (!oMod.IMPORTO_ASSEGNATO || isNaN(fImporto) || fImporto <= 0) {
                oViewModel.setProperty("/dialogModifica/ImportoValueState", "Error");
                oViewModel.setProperty("/dialogModifica/ImportoValueStateText", this._getText("msgImportoObbligatorio"));
                return false;
            }
            if (fImporto < fDistribuito) {
                oViewModel.setProperty("/dialogModifica/ImportoValueState", "Error");
                oViewModel.setProperty("/dialogModifica/ImportoValueStateText", this._getText("msgImportoSottoDistribuito"));
                return false;
            }
            return true;
        },
        onSalvaModificaBudgetDG: function () {
            if (!this._validaDialogModifica()) { return; }
            var oModel = this.getOwnerComponent().getModel();
            var oMod = this.getView().getModel("viewModel").getProperty("/dialogModifica");
            var sPath = "/Budget_DG(ESERCIZIO='" + oMod.ESERCIZIO + "',CENTRO_DI_COSTO_DG='" + oMod.CENTRO_DI_COSTO_DG + "')";
            var oPayload = {
                ESERCIZIO: oMod.ESERCIZIO,
                CENTRO_DI_COSTO_DG: oMod.CENTRO_DI_COSTO_DG,
                IMPORTO_ASSEGNATO: parseFloat(oMod.IMPORTO_ASSEGNATO.replace(",", ".")).toFixed(2)
            };
            oModel.update(sPath, oPayload, {
                success: function () {
                    if (this._oDialogModifica) { this._oDialogModifica.close(); }
                    MessageBox.success(this._getText("msgSalvataggioOk"), {
                        onClose: function () {
                            this._caricaDatiDG(this._sEsercizio, this._sKostlDg);
                        }.bind(this)
                    });
                }.bind(this),
                error: function (oError) { this._gestisciErrore(oError); }.bind(this)
            });
        },
        onAnnullaModificaBudgetDG: function () {
            if (this._oDialogModifica) { this._oDialogModifica.close(); }
        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLista");
        },
        onAggiungiUO: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogUOTitolo", this._getText("titleDialogAssegnazioneUO"));
            oViewModel.setProperty("/dialogUOCdCUOEditable", true);
            oViewModel.setProperty("/dialogUO", {
                ESERCIZIO: oViewModel.getProperty("/ESERCIZIO"),
                CENTRO_DI_COSTO_DG: oViewModel.getProperty("/CENTRO_DI_COSTO_DG"),
                CENTRO_DI_COSTO_UO: "",
                IMPORTO_ASSEGNATO: "",
                IMPORTO_CONSUMATO: "",
                DATA_ASSEGNAZIONE: "",
                UTENTE_ASSEGNAZIONE: "",
                DATA_MODIFICA: "",
                UTENTE_MODIFICA: "",
                CdCUOValueState: "None",
                CdCUOValueStateText: "",
                ImportoValueState: "None",
                ImportoValueStateText: ""
            });
            this._apriDialogUO();
        },
        onModificaUO: function (oEvent) {
            var sKostlUO = oEvent.getSource().data("value");
            var oViewModel = this.getView().getModel("viewModel");
            var aBudgetUO = oViewModel.getProperty("/budgetUO");
            var oUO = aBudgetUO.find(function (oItem) {
                return oItem.CENTRO_DI_COSTO_UO === sKostlUO;
            });
            if (!oUO) {
                return;
            }
            oViewModel.setProperty("/dialogUOTitolo", this._getText("btnModifica") + " UO " + sKostlUO);
            oViewModel.setProperty("/dialogUOCdCUOEditable", false);
            oViewModel.setProperty("/dialogUO", Object.assign({
                CdCUOValueState: "None",
                CdCUOValueStateText: "",
                ImportoValueState: "None",
                ImportoValueStateText: ""
            }, oUO));
            this._apriDialogUO();
        },
        _apriDialogUO: function () {
            if (!this._oDialogUO) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "rlbudget.view.fragment.AssegnazioneBudgetUO",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogUO = oDialog;
                    this.getView().addDependent(this._oDialogUO);
                    this._oDialogUO.open();
                }.bind(this));
            } else {
                this._oDialogUO.open();
            }
        },
        onCdCUOLiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogUO/CdCUOValueState", "None");
            oViewModel.setProperty("/dialogUO/CdCUOValueStateText", "");
        },
        onImportoUOLiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogUO/ImportoValueState", "None");
            oViewModel.setProperty("/dialogUO/ImportoValueStateText", "");
        },
        onSalvaUO: function () {
            if (!this._validaDialogUO()) { return; }
            var oModel = this.getOwnerComponent().getModel();
            var oDialogUO = this.getView().getModel("viewModel").getProperty("/dialogUO");
            var oPayload = {
                ESERCIZIO: oDialogUO.ESERCIZIO,
                CENTRO_DI_COSTO_DG: oDialogUO.CENTRO_DI_COSTO_DG,
                CENTRO_DI_COSTO_UO: oDialogUO.CENTRO_DI_COSTO_UO.trim(),
                IMPORTO_ASSEGNATO: parseFloat(oDialogUO.IMPORTO_ASSEGNATO.replace(",", ".")).toFixed(2)
            };
            oModel.create("/Budget_UO", oPayload, {
                success: function () {
                    if (this._oDialogUO) { this._oDialogUO.close(); }
                    MessageBox.success(this._getText("msgSalvataggioOk"), {
                        onClose: function () {
                            this._caricaDatiUO(this._sEsercizio, this._sKostlDg);
                        }.bind(this)
                    });
                }.bind(this),
                error: function (oError) { this._gestisciErrore(oError); }.bind(this)
            });
        },
        onAnnullaUO: function () {
            if (this._oDialogUO) {
                this._oDialogUO.close();
            }
        }
    });
});