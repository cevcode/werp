export class Culture {

    // tslint:disable-next-line:variable-name
    public Id: number;
    public name: string;
    public fullName: string;
    public style: string;
    public default: boolean;

    constructor(culture: any) {
        this.Id = culture.Id;
        this.name = culture.Name;
        this.fullName = culture.FullName;
        this.style = culture.Style;
        this.default = culture.Default;
    }

    public get Icon(): string {
        return this.style || "UILocale " + this.name;
    }

    public toString() {
        return `${this.name}  ${this.fullName}`;
    }
}

export class CultureWithFmt extends Culture {

    public longDateFmt;
    public shortDateFmt;
    public shortDayNames;
    public shortMonthNames;
    public dayNames;
    public monthNames;
    public shortTimeFmt;
    public fullDateFmt;
    public dateTimeFmt;
    public monthDay;
    public fullDateNoDay;
    public yearMonthFmt;
    public firstDayOfWeek;
    public firstDayOfWorkWeek = 1;
    public is24Hrs;

    constructor(culture) {
        super(culture);
        this.Id = culture.CultureId;
        this.name = culture.CultureName;
        this.fullName = culture.CultureFullName;
        this.longDateFmt = culture.LongDateFormat;
        this.shortDateFmt = culture.ShortDateFormat;
        this.shortDayNames = culture.ShortDayNames;
        this.shortMonthNames = culture.ShortMonthNames;
        this.dayNames = culture.DayNames;
        this.monthNames = culture.MonthNames;
        this.shortTimeFmt = culture.ShortTimeFormat;
        this.fullDateFmt = culture.FullDateFormat;
        this.dateTimeFmt = culture.DateTimeFormat;
        this.monthDay = culture.MonthDayFormat;
        this.fullDateNoDay = culture.FullDateNoDay;
        this.yearMonthFmt = culture.YearMonthFormat;
        this.firstDayOfWeek = culture.FirstDayOfWeek;
        this.firstDayOfWorkWeek = 1;
        this.is24Hrs = culture.Is24Hrs;
    }
}
