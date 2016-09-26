/*
 * Test Schemas and SchemaTypes.
 */

import * as Schema from '../../Schema';
import { expect } from 'chai';
import _ from 'lodash';

describe('support functions', () => {
    describe('isValidDate()', () => {
        it('should return true for a valid date', done => {
            expect(Schema.isValidDate(new Date())).to.be.true;
            done();
        });

        it('should return false an invalid date', done => {
            expect(Schema.isValidDate(new Date('bad date right here'))).to.be.false;
            done();
        });

        it('should return false a non-date', done => {
            expect(Schema.isValidDate('not a date at all')).to.be.false;
            done();
        });
    });

    // Some primitives to test against
    const testBasicPrimitives = [
        1,
        Infinity,
        null,
        { foo: 'bar' },
        true,
        'hello, world',
        () => true,
    ];

    describe('typeValidator()', () => {
        it('should generate correct validators for primitives', done => {
            // Values for each primitive type
            // Make sure each one validates correctly
            testBasicPrimitives.forEach(
                test => {
                    expect(Schema.typeValidator(typeof test)(test)).to.be.true;
                }
            );

            done();
        });
    });

    describe('isSomething()', () => {
        it('should return true for some things', done => {
            testBasicPrimitives.forEach(
                test => expect(Schema.isSomething(test)).to.be.true
            );
            done();
        });

        it('should return false for undefined', done => {
            expect(Schema.isSomething(undefined)).to.be.false;
            done();
        });
    });

    describe('isArray()', () => {
        it('should have the same behavior as Array.isArray for all types', done => {
            const values = [
                ...testBasicPrimitives,
                [ 1, 2, 3 ],
                NaN,
                [],
                new Array(10),
                new Buffer('something')
            ];

            values.forEach(
                test => expect(Schema.isArray(test) === Array.isArray(test)).to.be.true
            );

            done();
        });
    });

    describe('isObject()', () => {
        it('should return true for a vanilla object', done => {
            expect(Schema.isObject({})).to.be.true;
            expect(Schema.isObject(new Object())).to.be.true;
            done();
        });

        it('should return false for non-vanilla-objects', done => {
            const nonObjects = [
                new Date(),
                NaN,
                [ 1, 2, 3 ],
                new Buffer('foo'),
                undefined,
                null,
            ];

            expect(_.every(nonObjects, _.negate(Schema.isObject))).to.be.true;

            done();
        })
    });

    describe('every()', () => {
        it('should return true for basic cases', done => {
            expect(Schema.every([ true, true, true, true, 1 ], Boolean)).to.be.true;
            expect(Schema.every([ 1, 2, 3, 4, 5 ], num => num < 6)).to.be.true;
            done();
        });

        it('should return false for basic cases ', done => {
            expect(Schema.every([ true, true, true, true, 0 ], Boolean)).to.be.false;
            expect(Schema.every([ 1, 2, 3, 4, 5, 6 ], num => num < 6)).to.be.false;
            done();
        });

        it('should pass the correct parameters to predicate', done => {
            const array = [ 0, 1, 2, 3 ];
            Schema.every(
                array,
                (current, index, entireArray) => {
                    // Make sure current and index are accurate
                    expect(array[index] === current).to.be.true;

                    // Make sure entireArray is being passed
                    expect(array === entireArray).to.be.true;
                }
            );

            done();
        });

        it('should throw if a non-array is passed', done => {
            expect(() => Schema.every(null, null)).to.throw(Error, /Expected "array"/);
            done();
        });
    });

    describe('maybeRequired()', () => {
        const maybeValidateString = Schema.maybeRequired(str => typeof str === 'string');

        it('should only validate extant values of the correct type', done => {
            const validateString = maybeValidateString(true);
            expect(validateString('foo')).to.be.true;
            expect(validateString(10)).to.be.false;
            expect(validateString(undefined)).to.be.false;

            done();
        });

        it('should validate values of the correct type, or undefined', done => {
            const validateStringOrNothing = maybeValidateString(false);
            expect(validateStringOrNothing('foo')).to.be.true;
            expect(validateStringOrNothing(10)).to.be.false;
            expect(validateStringOrNothing(undefined)).to.be.true;

            done();
        });
    });
});