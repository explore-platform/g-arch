from astropy.io import fits
from astropy.io import votable
import numpy as np
import pandas as pd

""" convert G-Arch FITS to VOTable / JSON """

def fits2votable(input_fits, output_vot):
    
    """ usage: fits2votable(input_fits, output_vot)
    
    input_fits = Path/string of FITs file name
    output_fits = Path/string of VOTable filename

    """
    from astropy.io.votable.tree import VOTableFile, Resource, Table, Field
    from astropy.io import fits

    h=fits.open(input_fits)
    hdr = h[0].header.copy(); # Copy also the header
    im=h[0].data

    length = im[0].size()
    nr_objects = im[1].size()

    votable = VOTableFile()
    resource = Resource()
    votable.resources.append(resource)
    
    table = Table(votable)
    resource.tables.append(table)

    for i in nr_objects:
        table.fields.extend([
            Field(votable, name=str(gaia_id), datatype='char', arraysize="")
        ])

    table.create_arrays(nr_objects)
    
    return


def ExtractGaiaFromFITS(input_fits, input_csv, output_base, gaia_id=5542875820599516160, format="VOTable", debug=False):

    """ Read FITS + CSV file with the list of Gaia IDs in the same order
    """

    from astropy.io import fits
    import numpy as np
    import pandas as pd
    import json

    from astropy.io.votable.tree import VOTableFile, Resource, Table, Field

    h=fits.open(input_fits)
    hdr = h[0].header.copy(); # Copy also the header
    im=h[0].data
    length, nr_objects = im.shape

    obs = pd.read_csv(input_csv, header=None, names=['index', 'source_id'], index_col=False, sep='\s+')
    #obs.iloc[:,0]
    #obs[obs.columns[0]]
    idx=np.where(obs['source_id'] == gaia_id)

    wavelength = np.arange(start=800.0, stop=880.0, step=0.1)
    spectrum = im[:,idx[0][0]]

    if (format == "VOTable"):

        votable = VOTableFile()
        resource = Resource()
        votable.resources.append(resource)
    
        table = Table(votable)
        resource.tables.append(table)

        #votable.get_first_table().format = 'binary'
        #votable.get_first_table().format = 'tabledata'
        votable.set_all_tables_format = 'tabledata'
        #votable.set_all_tables_format = 'binary'

        table.fields.extend([
                Field(votable, name="wavelength", datatype='double', arraysize="1"),
                Field(votable, name="spectrum", datatype='double', arraysize="1")
            ])

        table.create_arrays(length)

        for i in range(length):
            table.array[i] = ( wavelength[i], spectrum[i] )

        votable.to_xml(output_base+".vot")

    elif (format == "JSON"):

        df = pd.DataFrame(zip(wavelength, spectrum), index=None, columns=['wavelength','spectrum'])

        df.to_json(output_base+".json", orient="values")

        if (debug=True):
            f = open(output_base+".json")
            parsed = json.load(f)
            print(parsed) 
            json.dumps(parsed, indent=4)

    else:
        print("please select the output file format: VOTable or JSON")
        
    return 





# """ tests """
# gaia_id = 5542875820599516160
# input_fits = 'CM_spectra.fits'
# input_csv = 'CM.dat'
# output_base =  str(gaia_id)

# ExtractGaiaFromFITS(input_fits, input_csv, output_base, gaia_id=gaia_id, format="VOTable")
# ExtractGaiaFromFITS(input_fits, input_csv, output_base, gaia_id=gaia_id, format="JSON")
# fits2votable('CM_spectra.fits', 'CM_spectra.vot')

