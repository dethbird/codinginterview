
import React, { useReducer, useEffect, useRef } from 'react'

const steps = ['Account', 'Profile', 'Confirm']

const initialState = {
    step: 0,
    data: {
        email: '',
        password: '',
        name: '',
        city: ''
    },
    errors: {},
    submitted: false
}

const reducer = (state, action) => {
    switch (action.type) {
        case 'update':
            return { ...state, data: { ...state.data, ...action.payload } }
        case 'setErrors':
            return { ...state, errors: action.payload } 
        case 'next':
            return { ...state, step: state.step + 1 }
        case 'back':
            return { ...state, step: state.step - 1 }
        case 'submit':
            return { ...state, submitted: true }
        default:
            return state
    }
}

const validate = (data, step) => {
    let e = {};
    if (step === 0) {
        if (!data.email) e.email = 'Email required'
        else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Invalid email'
        if (!data.password) e.password = 'Password required'
        else if (data.password.length < 6) e.password = 'Min 6 chars'
    } else if (step === 1) {
        if (!data.name) e.name = 'Name is required'
        if (!data.city) e.city = 'City is required'
    }
    return e;
}

export default function FormWizard() {

    const didMount = useRef(false);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { step, data, errors, submitted } = state;
    const isLast = step === 2;

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        dispatch({type: 'setErrors', payload: validate(data, step)})
    }, [data, step]);

    const nextOrSubmit = () => {
        const currentErrors = validate(data, step);
        dispatch({ type: 'setErrors', payload: currentErrors });
        if (Object.keys(currentErrors).length === 0) {
            if (step === 2) {
                dispatch({ type: 'submit' });
            } else {
                dispatch({ type: 'next' });
            }
        }
        
    }

    if (submitted) {
        return (
            <div data-testid="submitConfirm" className="notification is-success">Submitted!</div>
        )
    }

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
                        aria-label="email"
                        value={data.email} 
                        placeholder='joe@email.com' 
                        onChange={(e) => dispatch({ type: 'update', payload: { email: e.target.value } })} 
                    />
                    {errors.email && (
                        <div data-testid="emailError" className="message is-danger">{ errors.email }</div>
                    )}
                </label>
                <label className="label">Password:
                    <input 
                        className="input"
                        type="password" 
                        aria-label="password"
                        value={data.password} 
                        onChange={(e) => dispatch({ type: 'update', payload: { password: e.target.value } })} 
                    />
                    {errors.password && (
                        <div data-testid="passwordError" className="message is-danger">{ errors.password }</div>
                    )}
                </label>
                </>
            )}
            {step === 1 && (
                <>
                <label className="label">Name:
                    <input 
                        className="input"
                        type="text" 
                        aria-label="name"
                        value={data.name} 
                        placeholder='David Coldplay' 
                        onChange={(e) => dispatch({ type: 'update', payload: { name: e.target.value } })} 
                    />
                    {errors.name && (
                        <div data-testid="nameError" className="message is-danger">{ errors.name }</div>
                    )}
                </label>
                <label className="label">City:
                    <input 
                        className="input"
                        type="text" 
                        aria-label="city"
                        value={data.city} 
                        onChange={(e) => dispatch({ type: 'update', payload: { city: e.target.value } })} 
                    />
                    {errors.city && (
                        <div data-testid="cityError" className="message is-danger">{ errors.city }</div>
                    )}
                </label>
                </>
            )}
            {step === 2 && (
                <div data-testid="confirm">
                <h4 as="title">Confirm:</h4>
                <strong>Email: </strong> { data.email }<br />
                <strong>Password: </strong> XXX<br />
                <strong>Name: </strong> { data.name }<br />
                <strong>City: </strong> { data.city }<br />
                </div>
            )}
            
            </div>
            <button aria-label="backButton" disabled={step === 0} className="button" onClick={() => { dispatch({ type: 'back' }) }}>Back</button>
            <button aria-label="nextButton" disabled={Object.keys(errors).length > 0} className="button" onClick={ nextOrSubmit }>{ isLast ? 'Submit' : 'Next'}</button>
        </div>
    )
}
