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
    return Controller.extend("rlbudget.controller.ListaBudgetDG", {
        formatter: formatter,
        onInit: function () {
            var iAnnoCorrente = new Date().getFullYear();
            var oViewModel = new JSONModel({
                filtroEsercizio: iAnnoCorrente.toString(),
                filtroCdCDG: "",
                busy: false,
                anni: [],
                anniCopia: [],
                dialogCrea: {
                    ESERCIZIO: "",
                    CENTRO_DI_COSTO_DG: "",
                    IMPORTO_ASSEGNATO: "",
                    EsercizioValueState: "None",
                    EsercizioValueStateText: "",
                    CdCDGValueState: "None",
                    CdCDGValueStateText: "",
                    ImportoValueState: "None",
                    ImportoValueStateText: ""
                },
                dialogCopia: {
                    esercizioDa: "",
                    esercizioA: "",
                    azzeraImporti: false,
                    EsercizioDaValueState: "None",
                    EsercizioDaValueStateText: "",
                    EsercizioAValueState: "None",
                    EsercizioAValueStateText: ""
                }
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
            this.getView().getModel("viewModel").setProperty("/anni", aAnni);
            var oSelect = this.byId("selEsercizio");
            oSelect.bindItems({
                path: "viewModel>/anni",
                template: new sap.ui.core.Item({
                    key: "{viewModel>key}",
                    text: "{viewModel>text}"
                })
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
                    this._gestisciErrore(oError);
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
        _validaDialogCrea: function (aEsistenti) {
            var oViewModel = this.getView().getModel("viewModel");
            var oCrea = oViewModel.getProperty("/dialogCrea");
            var bValido = true;
            var iAnnoCorrente = new Date().getFullYear();
            oViewModel.setProperty("/dialogCrea/EsercizioValueState", "None");
            oViewModel.setProperty("/dialogCrea/EsercizioValueStateText", "");
            oViewModel.setProperty("/dialogCrea/CdCDGValueState", "None");
            oViewModel.setProperty("/dialogCrea/CdCDGValueStateText", "");
            oViewModel.setProperty("/dialogCrea/ImportoValueState", "None");
            oViewModel.setProperty("/dialogCrea/ImportoValueStateText", "");
            if (!oCrea.ESERCIZIO || !/^\d{4}$/.test(oCrea.ESERCIZIO.trim())) {
                oViewModel.setProperty("/dialogCrea/EsercizioValueState", "Error");
                oViewModel.setProperty("/dialogCrea/EsercizioValueStateText", this._getText("msgEsercizioFormato"));
                bValido = false;
            } else {
                var iEsercizio = parseInt(oCrea.ESERCIZIO, 10);
                if (iEsercizio < iAnnoCorrente - 1) {
                    oViewModel.setProperty("/dialogCrea/EsercizioValueState", "Warning");
                    oViewModel.setProperty("/dialogCrea/EsercizioValueStateText", this._getText("msgEsercizioPassato"));
                } else if (iEsercizio > iAnnoCorrente + 2) {
                    oViewModel.setProperty("/dialogCrea/EsercizioValueState", "Warning");
                    oViewModel.setProperty("/dialogCrea/EsercizioValueStateText", this._getText("msgEsercizioFuturo"));
                }
            }
            if (!oCrea.CENTRO_DI_COSTO_DG || oCrea.CENTRO_DI_COSTO_DG.trim() === "") {
                oViewModel.setProperty("/dialogCrea/CdCDGValueState", "Error");
                oViewModel.setProperty("/dialogCrea/CdCDGValueStateText", this._getText("msgCdCDGObbligatorio"));
                bValido = false;
            } else if (bValido) {
                var bEsiste = aEsistenti.some(function (oItem) {
                    return oItem.ESERCIZIO === oCrea.ESERCIZIO.trim() &&
                        oItem.CENTRO_DI_COSTO_DG === oCrea.CENTRO_DI_COSTO_DG.trim();
                });
                if (bEsiste) {
                    oViewModel.setProperty("/dialogCrea/CdCDGValueState", "Error");
                    oViewModel.setProperty("/dialogCrea/CdCDGValueStateText", this._getText("msgBudgetGiaEsistente"));
                    bValido = false;
                }
            }
            var fImporto = parseFloat(oCrea.IMPORTO_ASSEGNATO);
            if (!oCrea.IMPORTO_ASSEGNATO || oCrea.IMPORTO_ASSEGNATO.trim() === "" || isNaN(fImporto) || fImporto <= 0) {
                oViewModel.setProperty("/dialogCrea/ImportoValueState", "Error");
                oViewModel.setProperty("/dialogCrea/ImportoValueStateText", this._getText("msgImportoObbligatorio"));
                bValido = false;
            }
            return bValido;
        },
        _validaDialogCopia: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oCopia = oViewModel.getProperty("/dialogCopia");
            var bValido = true;
            oViewModel.setProperty("/dialogCopia/EsercizioDaValueState", "None");
            oViewModel.setProperty("/dialogCopia/EsercizioDaValueStateText", "");
            oViewModel.setProperty("/dialogCopia/EsercizioAValueState", "None");
            oViewModel.setProperty("/dialogCopia/EsercizioAValueStateText", "");
            if (!oCopia.esercizioDa || oCopia.esercizioDa === "") {
                oViewModel.setProperty("/dialogCopia/EsercizioDaValueState", "Error");
                oViewModel.setProperty("/dialogCopia/EsercizioDaValueStateText", this._getText("msgEsercizioObbligatorio"));
                bValido = false;
            }
            if (!oCopia.esercizioA || !/^\d{4}$/.test(oCopia.esercizioA.trim())) {
                oViewModel.setProperty("/dialogCopia/EsercizioAValueState", "Error");
                oViewModel.setProperty("/dialogCopia/EsercizioAValueStateText", this._getText("msgEsercizioFormato"));
                bValido = false;
            } else if (oCopia.esercizioDa === oCopia.esercizioA.trim()) {
                oViewModel.setProperty("/dialogCopia/EsercizioAValueState", "Error");
                oViewModel.setProperty("/dialogCopia/EsercizioAValueStateText", this._getText("msgEsercizioCopiaStesoAnno"));
                bValido = false;
            }
            return bValido;
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
            var oViewModel = this.getView().getModel("viewModel");
            var iAnnoCorrente = new Date().getFullYear();
            oViewModel.setProperty("/dialogCrea", {
                ESERCIZIO: iAnnoCorrente.toString(),
                CENTRO_DI_COSTO_DG: "",
                IMPORTO_ASSEGNATO: "",
                EsercizioValueState: "None",
                EsercizioValueStateText: "",
                CdCDGValueState: "None",
                CdCDGValueStateText: "",
                ImportoValueState: "None",
                ImportoValueStateText: ""
            });
            if (!this._oDialogCrea) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "rlbudget.fragment.CreaBudgetDG",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogCrea = oDialog;
                    this.getView().addDependent(this._oDialogCrea);
                    this._oDialogCrea.open();
                }.bind(this));
            } else {
                this._oDialogCrea.open();
            }
        },
        onCreaBudgetEsercizioLiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogCrea/EsercizioValueState", "None");
            oViewModel.setProperty("/dialogCrea/EsercizioValueStateText", "");
        },
        onCreaBudgetCdCLiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogCrea/CdCDGValueState", "None");
            oViewModel.setProperty("/dialogCrea/CdCDGValueStateText", "");
        },
        onCreaBudgetImportoLiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogCrea/ImportoValueState", "None");
            oViewModel.setProperty("/dialogCrea/ImportoValueStateText", "");
        },
        onSalvaCreaBudgetDG: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oCrea = this.getView().getModel("viewModel").getProperty("/dialogCrea");
            var aEsistenti = [];
            var oData = oModel.getProperty("/Budget_DG");
            if (oData) {
                Object.keys(oData).forEach(function (sKey) {
                    if (oData[sKey] && oData[sKey].ESERCIZIO) {
                        aEsistenti.push(oData[sKey]);
                    }
                });
            }
            if (!this._validaDialogCrea(aEsistenti)) {
                return;
            }
            var oPayload = {
                ESERCIZIO: oCrea.ESERCIZIO.trim(),
                CENTRO_DI_COSTO_DG: oCrea.CENTRO_DI_COSTO_DG.trim(),
                IMPORTO_ASSEGNATO: parseFloat(oCrea.IMPORTO_ASSEGNATO)
            };
            oModel.create("/Budget_DG", oPayload, {
                success: function () {
                    if (this._oDialogCrea) { this._oDialogCrea.close(); }
                    MessageBox.success(this._getText("msgSalvataggioOk"), {
                        onClose: function () { this._caricaDati(); }.bind(this)
                    });
                }.bind(this),
                error: function (oError) { this._gestisciErrore(oError); }.bind(this)
            });
        },
        onAnnullaCreaBudgetDG: function () {
            if (this._oDialogCrea) {
                this._oDialogCrea.close();
            }
        },
        onCopiaEsercizio: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var iAnnoCorrente = new Date().getFullYear();
            var oModel = this.getOwnerComponent().getModel();
            var aEsercizi = [];
            var oData = oModel.getProperty("/Budget_DG");
            if (oData) {
                Object.keys(oData).forEach(function (sKey) {
                    var oItem = oData[sKey];
                    if (oItem && oItem.ESERCIZIO && aEsercizi.indexOf(oItem.ESERCIZIO) === -1) {
                        aEsercizi.push(oItem.ESERCIZIO);
                    }
                });
                aEsercizi.sort().reverse();
            }
            if (aEsercizi.length === 0) {
                for (var i = iAnnoCorrente; i >= iAnnoCorrente - 4; i--) {
                    aEsercizi.push(i.toString());
                }
            }
            var aAnniCopia = aEsercizi.map(function (sE) {
                return { key: sE, text: sE };
            });
            oViewModel.setProperty("/anniCopia", aAnniCopia);
            oViewModel.setProperty("/dialogCopia", {
                esercizioDa: aAnniCopia.length > 0 ? aAnniCopia[0].key : "",
                esercizioA: (iAnnoCorrente + 1).toString(),
                azzeraImporti: false,
                EsercizioDaValueState: "None",
                EsercizioDaValueStateText: "",
                EsercizioAValueState: "None",
                EsercizioAValueStateText: ""
            });
            if (!this._oDialogCopia) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "rlbudget.fragment.CopiaEsercizio",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogCopia = oDialog;
                    this.getView().addDependent(this._oDialogCopia);
                    var oSelectDa = Fragment.byId(this.getView().getId(), "selCopiaEsercizioDa");
                    if (oSelectDa) {
                        oSelectDa.bindItems({
                            path: "viewModel>/anniCopia",
                            template: new sap.ui.core.Item({
                                key: "{viewModel>key}",
                                text: "{viewModel>text}"
                            })
                        });
                    }
                    this._oDialogCopia.open();
                }.bind(this));
            } else {
                this._oDialogCopia.open();
            }
        },
        onCopiaEsercizioDaChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogCopia/EsercizioDaValueState", "None");
            oViewModel.setProperty("/dialogCopia/EsercizioDaValueStateText", "");
        },
        onCopiaEsercizioALiveChange: function () {
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/dialogCopia/EsercizioAValueState", "None");
            oViewModel.setProperty("/dialogCopia/EsercizioAValueStateText", "");
        },
        onConfermaCopiaEsercizio: function () {
            if (!this._validaDialogCopia()) { return; }
            var oViewModel = this.getView().getModel("viewModel");
            var oCopia = oViewModel.getProperty("/dialogCopia");
            var oModel = this.getOwnerComponent().getModel();
            var sEsercizioDa = oCopia.esercizioDa;
            var sEsercizioA = oCopia.esercizioA.trim();
            var bAzzera = oCopia.azzeraImporti;
            var aRecordDa = [];
            var oDataModel = oModel.getProperty("/Budget_DG");
            if (oDataModel) {
                Object.keys(oDataModel).forEach(function (sKey) {
                    var oItem = oDataModel[sKey];
                    if (oItem && oItem.ESERCIZIO === sEsercizioDa) {
                        aRecordDa.push(oItem);
                    }
                });
            }
            if (aRecordDa.length === 0) {
                MessageBox.warning(this._getText("msgNessunRecordDaCopia"));
                return;
            }
            var iCreati = 0;
            var iErrori = 0;
            var iTotale = aRecordDa.length;
            aRecordDa.forEach(function (oItem) {
                var oPayload = {
                    ESERCIZIO: sEsercizioA,
                    CENTRO_DI_COSTO_DG: oItem.CENTRO_DI_COSTO_DG,
                    IMPORTO_ASSEGNATO: bAzzera ? 0 : parseFloat(oItem.IMPORTO_ASSEGNATO)
                };
                oModel.create("/Budget_DG", oPayload, {
                    success: function () {
                        iCreati++;
                        if (iCreati + iErrori === iTotale) { this._onCopiaCompletata(iCreati, iErrori); }
                    }.bind(this),
                    error: function () {
                        iErrori++;
                        if (iCreati + iErrori === iTotale) { this._onCopiaCompletata(iCreati, iErrori); }
                    }.bind(this)
                });
            }.bind(this));
        },
        _onCopiaCompletata: function (iCreati, iErrori) {
            if (this._oDialogCopia) {
                this._oDialogCopia.close();
            }
            if (iErrori === 0) {
                MessageBox.success(this._getText("msgCopiaEsercizioOk"), {
                    onClose: function () {
                        this._caricaDati();
                    }.bind(this)
                });
            } else {
                MessageBox.warning(
                    this._getText("msgCopiaEsercizioParzialeErr") + " (" + iCreati + " OK, " + iErrori + " errori)",
                    {
                        onClose: function () {
                            this._caricaDati();
                        }.bind(this)
                    }
                );
            }
        },
        onAnnullaCopiaEsercizio: function () {
            if (this._oDialogCopia) {
                this._oDialogCopia.close();
            }
        }
    });
});