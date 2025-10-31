
import React, { useState, useReducer, useEffect, useRef } from 'react'

const steps = ['Account', 'Profile', 'Confirm']

const initialState = {
    step: 0,
    data: {
        email: '',
        password: '',
        name: '',
        city: ''
    },
    errors: [],
    submitted: false
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'update':
            return { ...state, data: { ...state.data, ...action.payload } }
        case 'next':
            return { ...state, step: state.step + 1 }
        case 'back':
            return { ...state, step: state.step - 1 }
        default:
            return state
    }
}

const validate = (data, step) => {
    let e = {};
    if (step === 0) {
        if (data.email === '') e.email = 'Email is required'
        if (data.password === '') e.password = 'Password is required'
    }
    console.log(e);
    return e;
}

export default function FormWizard() {
    // const [step, setStep] = useState(0)
    // const [data, setData] = useState({ email: '', password: '', name: '', city: '' })
    // TODO: render steps, validate, next/back, submit

    const didMount = useRef(false);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { step, data, errors, submitted } = state;

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        dispatch({type: 'validate', errors: validate(data, step)})
    }, [data, step]);


    return (
        <div>
            <h3 data-testid="step" className="title">Step {step + 1}: {steps[step]}</h3>
            <div aria-label={steps[step]}>
            {step === 0 && (
                <>
                <label className="label">Email:
                    <input 
                        className="input"
                        type="text" 
                        value={data.email} 
                        placeholder='joe@email.com' 
                        onChange={(e) => dispatch({ type: 'update', payload: { email: e.target.value } })} 
                    />
                </label>
                <label className="label">Passowrd:
                    <input 
                        className="input"
                        type="password" 
                        value={data.password} 
                        onChange={(e) => dispatch({ type: 'update', payload: { password: e.target.value } })} 
                    />
                </label>
                </>
            )}
            {step === 1 && (
                <>
                <label className="label">Name:
                    <input 
                        className="input"
                        type="text" 
                        value={data.name} 
                        placeholder='Joe' 
                        onChange={(e) => dispatch({ type: 'update', payload: { name: e.target.value } })} 
                    />
                </label>
                <label className="label">City:
                    <input 
                        className="input"
                        type="text" 
                        value={data.city} 
                        onChange={(e) => dispatch({ type: 'update', payload: { city: e.target.value } })} 
                    />
                </label>
                </>
            )}
            {step === 2 && (
                <div>step 2</div>
            )}
            
            </div>
            <button aria-label="backButton" disabled={step === 0} className="button" onClick={() => { dispatch({ type: 'back' }) }}>Back</button>
            <button aria-label="nextButton" className="button" onClick={() => { dispatch({ type: 'next' }) }}>Next</button>
        </div>
    )
}
