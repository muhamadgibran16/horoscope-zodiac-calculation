/**
 * Horoscope & Zodiac Calculation Utilities
 *
 * - getHoroscope(): Western zodiac sign based on month/day
 * - getZodiac(): Chinese zodiac animal based on birth year
 */

interface ZodiacDateRange {
    sign: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
}

const HOROSCOPE_SIGNS: ZodiacDateRange[] = [
    { sign: 'Capricorn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { sign: 'Aquarius', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: 'Pisces', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: 'Aries', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: 'Taurus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: 'Gemini', startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
    { sign: 'Cancer', startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
    { sign: 'Leo', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: 'Virgo', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: 'Libra', startMonth: 9, startDay: 23, endMonth: 10, endDay: 23 },
    { sign: 'Scorpio', startMonth: 10, startDay: 24, endMonth: 11, endDay: 21 },
    { sign: 'Sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

const CHINESE_ZODIAC_ANIMALS: string[] = [
    'Rat',
    'Ox',
    'Tiger',
    'Rabbit',
    'Dragon',
    'Snake',
    'Horse',
    'Goat',
    'Monkey',
    'Rooster',
    'Dog',
    'Pig',
];

/**
 * Get Western horoscope sign from a birthday.
 * e.g. Aug 28 → "Virgo"
 */
export function getHoroscope(birthday: Date): string {
    const month = birthday.getMonth() + 1; // 1-12
    const day = birthday.getDate();

    for (const range of HOROSCOPE_SIGNS) {
        // Handle Capricorn wrapping Dec → Jan
        if (range.startMonth > range.endMonth) {
            if (
                (month === range.startMonth && day >= range.startDay) ||
                (month === range.endMonth && day <= range.endDay)
            ) {
                return range.sign;
            }
        } else {
            if (
                (month === range.startMonth && day >= range.startDay) ||
                (month === range.endMonth && day <= range.endDay) ||
                (month > range.startMonth && month < range.endMonth)
            ) {
                return range.sign;
            }
        }
    }

    return 'Unknown';
}

/**
 * Get Chinese zodiac animal from a birthday.
 * The cycle of 12 animals is based on year % 12.
 * Base year: 1924 = Rat (index 0).
 * e.g. 1995 → "Pig"
 */
export function getZodiac(birthday: Date): string {
    const year = birthday.getFullYear();
    // 1924 is the Year of the Rat (index 0)
    const index = ((year - 1924) % 12 + 12) % 12;
    return CHINESE_ZODIAC_ANIMALS[index];
}
