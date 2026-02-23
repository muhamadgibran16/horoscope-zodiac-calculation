import { getHoroscope, getZodiac } from './horoscope.util.js';

describe('Horoscope Utility', () => {
    describe('getHoroscope (Western Zodiac)', () => {
        const testCases = [
            { date: '2000-01-15', expected: 'Capricorn' },
            { date: '2000-01-20', expected: 'Aquarius' },
            { date: '2000-02-19', expected: 'Pisces' },
            { date: '2000-03-21', expected: 'Aries' },
            { date: '2000-04-20', expected: 'Taurus' },
            { date: '2000-05-21', expected: 'Gemini' },
            { date: '2000-06-22', expected: 'Cancer' },
            { date: '2000-07-23', expected: 'Leo' },
            { date: '2000-08-23', expected: 'Virgo' },
            { date: '2000-09-23', expected: 'Libra' },
            { date: '2000-10-24', expected: 'Scorpio' },
            { date: '2000-11-22', expected: 'Sagittarius' },
            { date: '2000-12-22', expected: 'Capricorn' },
        ];

        testCases.forEach(({ date, expected }) => {
            it(`should return ${expected} for ${date}`, () => {
                expect(getHoroscope(new Date(date))).toBe(expected);
            });
        });

        // Boundary tests
        it('should return Capricorn for Dec 31', () => {
            expect(getHoroscope(new Date('2000-12-31'))).toBe('Capricorn');
        });

        it('should return Capricorn for Jan 1', () => {
            expect(getHoroscope(new Date('2000-01-01'))).toBe('Capricorn');
        });

        it('should return Aquarius for Jan 19 end boundary', () => {
            expect(getHoroscope(new Date('2000-01-19'))).toBe('Capricorn');
        });

        it('should return Virgo for Aug 28 (from Figma)', () => {
            expect(getHoroscope(new Date('1995-08-28'))).toBe('Virgo');
        });
    });

    describe('getZodiac (Chinese Zodiac)', () => {
        const testCases = [
            { year: 1924, expected: 'Rat' },
            { year: 1925, expected: 'Ox' },
            { year: 1926, expected: 'Tiger' },
            { year: 1927, expected: 'Rabbit' },
            { year: 1928, expected: 'Dragon' },
            { year: 1929, expected: 'Snake' },
            { year: 1930, expected: 'Horse' },
            { year: 1931, expected: 'Goat' },
            { year: 1932, expected: 'Monkey' },
            { year: 1933, expected: 'Rooster' },
            { year: 1934, expected: 'Dog' },
            { year: 1935, expected: 'Pig' },
        ];

        testCases.forEach(({ year, expected }) => {
            it(`should return ${expected} for year ${year}`, () => {
                expect(getZodiac(new Date(`${year}-06-15`))).toBe(expected);
            });
        });

        it('should return Pig for 1995 (from Figma)', () => {
            expect(getZodiac(new Date('1995-08-28'))).toBe('Pig');
        });

        it('should return Rat for 2024 (cycle repeat)', () => {
            expect(getZodiac(new Date('2024-01-01'))).toBe('Dragon');
        });

        it('should handle year 2000 correctly', () => {
            expect(getZodiac(new Date('2000-06-15'))).toBe('Dragon');
        });

        it('should correctly cycle for 12-year period', () => {
            const rat1 = getZodiac(new Date('1924-01-01'));
            const rat2 = getZodiac(new Date('1936-01-01'));
            expect(rat1).toBe(rat2);
        });
    });
});
