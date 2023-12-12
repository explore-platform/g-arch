def CreateFITS(
    gaia_fits='spectra.fits', 
    gaia_csv='GAIA_ID.csv', 
    target_csv='test_id.csv', 
    resolve=False,     
    output_base='', 
    output_name='spectra_xmatch.fits'

):

    """ From input catalog of source-ids create FITS file (e.g. 'input.fits') ready to feed into Matisse.

        The user provided target list should not contain any header lines and only single column of object IDs or names

        usage:
    
            CreateFITS(base_fits='spectra.fits', input_cat='list_sourceid.csv', output_base='')
    """

    import pandas as pd
    from astropy.io import fits
    import numpy as np
    import json
    import os

    from astroquery.simbad import Simbad
    

    if resolve == True:
        toberesolved = pd.read_csv(target_csv, names=['source_id']) # read list of user selected sources 
        tbr = list(toberesolved['source_id'])
        customSimbad=Simbad()
        customSimbad.remove_votable_fields('coordinates')
        customSimbad.add_votable_fields('ids')
        #result_table = customSimbad.query_objects(['HD147889', 'eta carinae'])
        result_table = customSimbad.query_objects(tbr)
        ids=result_table['IDS']
        resolved=[]
        for x in ids:
            for y in x.split('|'):
                if 'DR3' in y:
                    resolved.append(y[9:])
        resolved64=np.array(resolved, dtype=np.int64)
        #result_table = customSimbad.query_objectids('eta carinae')
        targets = pd.DataFrame(resolved64, columns=['source_id'])
        

    else: ## input needs to be a list of Gaia DR3 source_id (only the number)

        targets = pd.read_csv(target_csv, names=['source_id']) # read list of user selected sources
    

    all_gaia = pd.read_csv(gaia_csv) # read full list of Gaia RVS sources
    
    tab=pd.merge(all_gaia,targets, on=['source_id'], how='inner')

    result_path = os.path.join(output_base, 'result_xmatch.dat')
    np.savetxt(
        result_path, 
        np.array([tab['index_1'],tab['source_id']  ] ).T, 
        delimiter='\t', 
        fmt=" %i  %i"
    )


    h=fits.open(gaia_fits)
    hdr = h[0].header.copy(); # Copy also the header
    gaia_rvs_data=h[0].data

    if len(tab)==0:
        print('no match')
        return
    
    elif len(tab)==1:
        gaia_xm =  np.genfromtxt(result_path)
        tempset=np.int64(gaia_xm[0])
    else:    
        gaia_xm =  np.genfromtxt(result_path)
        tempset=np.int64(gaia_xm[:,0])-1

    hdu2 = fits.ImageHDU( np.float64([[846.01000000000000000000000000000000000000000000],[0.0300000000000000000000000000000000000]] ) )

    spectra= gaia_rvs_data[:,tempset]
    hdu1 = fits.PrimaryHDU( spectra, header=hdr)# Create a PrimaryHDU object to encapsulate the data;
    hdul = fits.HDUList([hdu1, hdu2])
    
    spectra_path = os.path.join(output_base, output_name)
    hdul.writeto( spectra_path, overwrite=True )
    hdul.close()
    del(hdul, hdu1, hdu2)
    print("Created: " + spectra_path + " (found "+str(len(tab))+" spectra)")
    
    return


# """ test """
# CreateFITS(gaia_fits='spectra.fits', gaia_csv='GAIA_ID.csv', target_csv='test_id.csv', resolve=False, output_base='')
# CreateFITS(gaia_fits='spectra.fits', gaia_csv='GAIA_ID.csv', target_csv='test1_id.csv', resolve=False, output_base='')