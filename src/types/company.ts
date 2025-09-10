interface CompanyConfigurations {
    type_company: string
    status_implantation: string
}

export interface Company {
    _id: number
    accountcode: string
    pabx: string
    configurations: CompanyConfigurations
    blocked: boolean

    painel_monitor_enabled: boolean
}

export const mapCompany = (data: any): Company => {
    let retorno = {
        _id: data._id,
        accountcode: data.accountcode || "",
        pabx: data.pabx || "",
        configurations: { type_company: data.configurations?.type_company || "", status_implantation: data.configurations?.status_implantation || "" },
        blocked: data.blocked || false,
        painel_monitor_enabled: data.painel_monitor_enabled || false,
    };

    return retorno;
}