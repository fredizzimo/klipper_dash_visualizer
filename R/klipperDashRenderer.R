# AUTO GENERATED FILE - DO NOT EDIT

klipperDashRenderer <- function(id=NULL, label=NULL, value=NULL) {
    
    props <- list(id=id, label=label, value=value)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'KlipperDashRenderer',
        namespace = 'klipper_dash_renderer',
        propNames = c('id', 'label', 'value'),
        package = 'klipperDashRenderer'
        )

    structure(component, class = c('dash_component', 'list'))
}
