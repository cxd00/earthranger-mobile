import { useState, useEffect } from 'react';

interface FormSideButtons {
    reportForm: any,
}

const FormSideButtons = ({ reportForm }) => { 
    return (
        <div className="horizontalbox">
            {reportForm}
            <div><p>d</p></div>
        </div>
    );

}

export default FormSideButtons;