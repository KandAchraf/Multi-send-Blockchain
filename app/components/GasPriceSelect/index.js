import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2,
  },
  menuItem: {
    fontSize: 24
  },
  select: {
    fontSize: 24,
  },
  inputLabel: {
    fontSize: 26,
    marginBottom: theme.spacing.unit * 2,
    position: 'unset'
  }
});

class SimpleSelect extends React.Component {
  state = {
    gas: this.props.gasPricesArray[0].value
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
    this.props.handleChangeGasPrice(event.target.value);
  };

  render() {
    const { classes, gasPricesArray } = this.props;

    return (
      <form className={classes.root} autoComplete="off">
        <FormControl className={classes.formControl}>
          <InputLabel className={classes.inputLabel} htmlFor="gas-simple">Gas Price</InputLabel>
          <Select
            className={classes.select}
            value={this.state.gas}
            onChange={this.handleChange}
            inputProps={{
              name: 'gas',
              id: 'gas-simple',
            }}
          >
            {gasPricesArray.map(n => {
            return (
                <MenuItem className={classes.menuItem}  key={n.label} value={n.value}>{`${n.label}`}</MenuItem>
            )})}
          </Select>
        </FormControl>
      </form>
    );
  }
}

SimpleSelect.propTypes = {
  classes: PropTypes.object.isRequired,
  gasPricesArray: PropTypes.array.isRequired,
  handleChangeGasPrice: PropTypes.func.isRequired,
};

const GasPriceSelect =  withStyles(styles)(SimpleSelect);
export default GasPriceSelect;